#!/usr/bin/env python3
"""
db_tools.py
===========

Read-only "tools" the chat agent can call to look up real inventory before
recommending anything to a shopper. Two functions, mirroring the two things
people ask for on Dobaeni: a product, or a brand.

Written in the same style as Google ADK's function-tool convention (plain
typed function, Args/Returns docstring, returns a small `status` dict) even
though this project wires tools through litellm/OpenAI-style function
calling rather than ADK itself — the shape is a good one to keep regardless
of framework, and it's what app.py expects back from each tool.

Read-only guarantees (defense in depth, three independent layers):
  1. Every query below is a hand-written SELECT. There is no code path here
     that can turn a tool call into an INSERT/UPDATE/DELETE.
  2. All user-supplied values travel through asyncpg's `$1, $2, ...`
     parameter placeholders — nothing is ever string-formatted into SQL.
     The only "dynamic" raw SQL fragments (ORDER BY, table joins) are picked
     from fixed dictionaries we wrote ourselves, never from user input.
  3. Every pooled connection sets `default_transaction_read_only = on` for
     its session, so even a future bug in this file gets rejected by
     Postgres itself with a permission error instead of silently mutating
     data.

For a fourth, DB-level layer, point AGENT_DATABASE_URL at a dedicated
Postgres role that only has SELECT grants — see sql/readonly_role.sql next
to this file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

import asyncpg

# The .env next to this file (server/.env). Used by the bootstrap helper below
# so the catalog tools can self-heal their DB connection instead of hard-failing
# with "AGENT_DATABASE_URL is not set" on a fresh checkout.
_ENV_PATH = Path(__file__).resolve().parent / ".env"

# Default connection that matches the local docker-compose.yml Postgres
# (user/password/db all "dobaeni", exposed on 5432). Used only as a fallback
# when no DB url is configured anywhere.
DEFAULT_DATABASE_URL = "postgresql://dobaeni:dobaeni@localhost:5432/dobaeni"

# Falls back to the app's own DATABASE_URL if a dedicated agent URL isn't
# set, but production deployments should set AGENT_DATABASE_URL to a
# read-only role (see sql/readonly_role.sql).
AGENT_DATABASE_URL = os.getenv("AGENT_DATABASE_URL") or os.getenv("DATABASE_URL")


def _read_env() -> dict[str, str]:
    """Parse server/.env into a {KEY: VALUE} dict (comments/blank lines skipped)."""
    if not _ENV_PATH.exists():
        return {}
    out: dict[str, str] = {}
    for line in _ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip()
    return out


def _write_env_var(key: str, value: str) -> None:
    """Upsert a single KEY=VALUE line in server/.env (preserving other vars)."""
    env = _read_env()
    env[key] = value
    _ENV_PATH.write_text(
        "\n".join(f"{k}={v}" for k, v in env.items()) + "\n",
        encoding="utf-8",
    )


def ensure_db_url_in_env() -> str:
    """Return a usable DB url, writing a default into server/.env if none is
    set anywhere (os.environ, .env). Lets the catalog tools work out of the box
    against the local docker-compose Postgres.

    Returns the connection string, or "" if it still couldn't be resolved.
    """
    url = os.getenv("AGENT_DATABASE_URL") or os.getenv("DATABASE_URL")
    if url:
        return url
    if not _ENV_PATH.exists():
        try:
            _ENV_PATH.write_text("", encoding="utf-8")
        except OSError:
            return ""
    _write_env_var("DATABASE_URL", DEFAULT_DATABASE_URL)
    os.environ["DATABASE_URL"] = DEFAULT_DATABASE_URL
    print(
        f"[db_tools] Wrote default DATABASE_URL to {_ENV_PATH} "
        f"-> {DEFAULT_DATABASE_URL}",
        flush=True,
    )
    return DEFAULT_DATABASE_URL

# Used to turn a product/brand slug into a link the chat UI can render.
# Point this at wherever the Next.js app is actually served.
SITE_BASE_URL = os.getenv("SITE_BASE_URL", "http://localhost:3000").rstrip("/")

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Lazily creates (once) and returns the shared read-only connection pool."""
    global _pool
    if _pool is None:
        db_url = AGENT_DATABASE_URL or ensure_db_url_in_env()
        if not db_url:
            raise RuntimeError(
                "AGENT_DATABASE_URL (or DATABASE_URL) is not set. The catalog "
                "tools need a Postgres connection string to run read-only "
                "queries against the same database Prisma writes to."
            )
        _pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=1,
            max_size=5,
            command_timeout=8,
            server_settings={"default_transaction_read_only": "on"},
        )
    return _pool


def _product_url(slug: str) -> str:
    return f"{SITE_BASE_URL}/product/{slug}"


def _brand_url(slug: str) -> str:
    return f"{SITE_BASE_URL}/brand/{slug}"


def _parse_json_list(raw: Any) -> list[str]:
    """Products/orgs store style tags etc. as a JSON-encoded string column."""
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return [str(x) for x in parsed] if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def _category_terms(category: str) -> list[str]:
    """Expand a shopper's category word into singular/plural variants so the
    keyword match catches both 'Dresses' and 'Wrap Dress', 'Kurta' and 'Kurtis'.
    """
    base = category.strip()
    if not base:
        return []
    terms = {base}
    if base.lower().endswith("s") and len(base) > 2:
        s1 = base[:-1]  # Sneakers -> Sneaker, Dresses -> Dresse
        terms.add(s1)
        if s1.lower().endswith("e") and len(s1) > 2:
            terms.add(s1[:-1])  # Dresse -> Dress
    else:
        terms.add(base + "s")  # Kurta -> Kurtas
    return [t for t in terms if t]


# Fixed, whitelisted ORDER BY fragments — sort_by is validated against these
# keys before use, so the SQL below never contains anything from the model.
_PRODUCT_SORT = {
    "trending": "trend_score DESC",
    "rating": 'p."ratingAvg" DESC NULLS LAST, p."ratingCount" DESC',
    "newest": 'p."createdAt" DESC',
    "price_low": "p.price ASC",
    "price_high": "p.price DESC",
}

_BRAND_SORT = {
    "trending": "trend_score DESC",
    "most_followed": 'o."followerCount" DESC',
    "top_rated": 'o."ratingAvg" DESC NULLS LAST, o."ratingCount" DESC',
}


# Hard filters every catalog query must satisfy (the rows the shopper can
# actually buy). Optional filters (aesthetic, category, budget, ...) are layered
# on top and progressively dropped when they return nothing — see find_products.
_PRODUCT_HARD_WHERE = [
    'p."isPublished" = true',
    'p."isActive" = true',
    "p.stock > 0",
    "p.slug IS NOT NULL",
    'o."isPublished" = true',
    "o.status IS DISTINCT FROM 'suspended'",
]

# Optional product filters, ordered by how aggressively they get dropped when a
# search comes back empty. Front of the list = dropped first. Strategy: drop the
# DESCRIPTIVE/structural filters first (occasion, category/type, gender), because
# those are the columns most likely to be NULL/unpopulated in the seed data (every
# product currently has a NULL categoryId) — and only THEN loosen the two things
# that are the shopper's real INTENT: their budget (min/max price) and their
# personal style (aesthetics). `query` is kept until last so we never throw away
# the shopper's own words.
_PRODUCT_RELAX_ORDER = [
    "occasion",
    "category",
    "gender",
    "min_price",
    "max_price",
    "aesthetics",
    "query",
]


async def find_products(
    query: str | None = None,
    aesthetics: list[str] | None = None,
    category: str | None = None,
    gender: str | None = None,
    occasion: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort_by: str = "trending",
    limit: int = 6,
) -> dict:
    """Search real, in-stock, published Dobaeni products.

    Read-only — this never creates, edits, or removes anything. Use it
    whenever a shopper wants product recommendations, outfit ideas, or is
    browsing by aesthetic / category / occasion / budget.

    Graceful degradation: the catalog is messy (some products have no category
    linked, occasion/styleKeywords are JSON arrays, budgets can be tighter than
    anything in stock). If the exact filters return zero rows, the tool
    automatically re-runs dropping the strictest filter one at a time — occasion,
    then category, then price, then gender, then aesthetics, keeping `query`
    last — until it finds something. The returned ``relaxed`` list names every
    filter it had to loosen, and ``fallback`` is true if even that failed and it
    fell back to plain trending products. Use those fields to be honest with the
    shopper instead of pretending nothing exists.

    Args:
        query: Free-text match against the product name/description.
        aesthetics: Style tags to match, e.g. ["Old Money", "Minimalist"].
            Any one match is enough (OR'd together).
        category: Category name to filter by, e.g. "Dresses".
        gender: One of "male", "female", "unisex".
        occasion: Occasion tag, e.g. "Wedding", "Work", "Party".
        min_price: Minimum price in the product's currency (NPR).
        max_price: Maximum price in the product's currency (NPR).
        sort_by: One of "trending", "rating", "newest", "price_low",
            "price_high". Defaults to "trending".
        limit: Max rows to return (clamped to 1-12).

    Returns:
        dict: {"status": "success", "count": int, "results": [...],
        "relaxed": [str], "fallback": bool, "note": str} where each result has
        name, brand, price, currency, rating_avg, rating_count, sold_count,
        style_keywords, image, url — or {"status": "error", ...} on failure.
    """
    limit = max(1, min(int(limit or 6), 12))
    sort_by = sort_by if sort_by in _PRODUCT_SORT else "trending"

    # Build the optional-filter builders. Each builder(idx) returns
    # (sql_clause, next_index, [params]) using safe $N placeholders.
    optionals: list[tuple[str, Any]] = []

    if occasion:
        oc = f"%{occasion}%"
        optionals.append(("occasion", lambda i, oc=oc: (f"p.occasion::text ILIKE ${i}", i + 1, [oc])))

    if category:
        # `categoryId` is NULL for every seeded product, so matching on the
        # category table alone returns nothing. Instead treat the shopper's
        # category word ("Dresses", "shoes", "kurta") as a keyword and match it
        # against the product's own name, tags, and style keywords — the places
        # a real category term actually shows up in this catalog.
        # Handle singular/plural so "Dresses" also matches "Wrap Dress",
        # "Kurta" also matches "Kurtis", etc.
        terms = _category_terms(category)

        def _build_cat(i: int, terms: list[str] = terms) -> tuple[str, int, list]:
            clauses: list[str] = []
            params: list[Any] = []
            for t in terms:
                ph = f"%{t}%"
                refs = []
                for _ in range(4):  # c.name, p.name, p.tags, p.styleKeywords
                    refs.append(f"${i}")
                    params.append(ph)
                    i += 1
                clauses.append(
                    f"(c.name ILIKE {refs[0]} OR p.name ILIKE {refs[1]} "
                    f'OR p.tags::text ILIKE {refs[2]} OR p."styleKeywords"::text ILIKE {refs[3]})'
                )
            return ("(" + " OR ".join(clauses) + ")", i, params)

        optionals.append(("category", _build_cat))

    if min_price is not None:
        mp = float(min_price)
        optionals.append(("min_price", lambda i, mp=mp: (f"p.price >= ${i}", i + 1, [mp])))

    if max_price is not None:
        xp = float(max_price)
        optionals.append(("max_price", lambda i, xp=xp: (f"p.price <= ${i}", i + 1, [xp])))

    if gender:
        g = gender.lower()
        optionals.append(("gender", lambda i, g=g: (f"LOWER(p.gender) = ${i}", i + 1, [g])))

    if aesthetics:
        tags = aesthetics[:5]

        def _build_aes(i: int, tags: list[str] = tags) -> tuple[str, int, list]:
            clauses: list[str] = []
            params: list[Any] = []
            for tag in tags:
                params.append(f"%{tag}%")
                clauses.append(f'p."styleKeywords"::text ILIKE ${i}')
                i += 1
            return ("(" + " OR ".join(clauses) + ")", i, params)

        optionals.append(("aesthetics", _build_aes))

    if query:
        q = f"%{query}%"
        optionals.append(
            (
                "query",
                lambda i, q=q: (
                    f"(p.name ILIKE ${i} OR p.description ILIKE ${i} "
                    f'OR p."styleKeywords"::text ILIKE ${i})',
                    i + 1,
                    [q],
                ),
            )
        )

    # Always respect _PRODUCT_RELAX_ORDER when deciding drop priority, even if
    # the model supplied filters in a different order.
    order_index = {name: _PRODUCT_RELAX_ORDER.index(name) for name, _ in optionals}
    optionals.sort(key=lambda item: order_index[item[0]])

    async def _run(active_labels: set[str]) -> list:
        where = list(_PRODUCT_HARD_WHERE)
        params: list[Any] = []
        idx = 1
        for label, builder in optionals:
            if label not in active_labels:
                continue
            clause, idx, oparams = builder(idx)
            where.append(clause)
            params.extend(oparams)
        params.append(limit)
        sql = f"""
            SELECT
                p.id, p.name, p.slug, p.price,
                p."compareAtPrice" AS compare_at_price,
                p.currency, p."styleKeywords" AS style_keywords, p.gender, p.material,
                p."ratingAvg" AS rating_avg, p."ratingCount" AS rating_count,
                p."soldCount" AS sold_count, p."likeCount" AS like_count,
                o.name AS brand_name, o.slug AS brand_slug, o.tier AS brand_tier,
                o."isVerified" AS brand_verified,
                (SELECT pi.url FROM "productImage" pi WHERE pi."productId" = p.id
                    ORDER BY pi.position ASC LIMIT 1) AS image,
                (p."soldCount" * 3 + p."likeCount" * 1 + p."viewCount" * 0.05
                    + p."ratingAvg" * p."ratingCount" * 2) AS trend_score
            FROM product p
            JOIN organization o ON o.id = p."organizationId"
            LEFT JOIN category c ON c.id = p."categoryId"
            WHERE {' AND '.join(where)}
            ORDER BY {_PRODUCT_SORT[sort_by]}
            LIMIT ${len(params)}
        """
        pool = await get_pool()
        async with pool.acquire() as conn:
            return await conn.fetch(sql, *params)

    relaxed: list[str] = []
    fallback = False
    try:
        active = {label for label, _ in optionals}
        rows = await _run(active)
        # Drop the strictest filter first until we get results.
        drop_queue = [label for label, _ in optionals]  # already in relax order
        while not rows and drop_queue:
            dropped = drop_queue.pop(0)
            relaxed.append(dropped)
            active.discard(dropped)
            rows = await _run(active)
        if not rows:
            fallback = True
            rows = await _run(set())  # plain trending, no filters
    except Exception as exc:  # noqa: BLE001 - surfaced to the model as a tool error
        return {"status": "error", "error_message": f"Catalog lookup failed: {exc}"}

    results = [
        {
            "name": r["name"],
            "brand": r["brand_name"],
            "brand_slug": r["brand_slug"],
            "brand_verified": bool(r["brand_verified"]),
            "brand_tier": r["brand_tier"],
            "price": r["price"],
            "compare_at_price": r["compare_at_price"],
            "currency": r["currency"] or "NPR",
            "rating_avg": round(r["rating_avg"] or 0, 1),
            "rating_count": r["rating_count"] or 0,
            "sold_count": r["sold_count"] or 0,
            "style_keywords": _parse_json_list(r["style_keywords"]),
            "gender": r["gender"],
            "material": r["material"],
            "image": r["image"],
            "url": _product_url(r["slug"]),
            "brand_url": _brand_url(r["brand_slug"]),
        }
        for r in rows
    ]

    if fallback:
        note = "No items matched your filters; showing popular products instead."
    elif relaxed:
        _FRIENDLY = {
            "occasion": "occasion",
            "category": "category/type",
            "gender": "gender",
            "min_price": "minimum price",
            "max_price": "maximum price",
            "aesthetics": "style",
            "query": "your search words",
        }
        dropped = ", ".join(_FRIENDLY.get(r, r) for r in relaxed)
        note = "No exact match — broadened the search by ignoring: " + dropped + "."
    else:
        note = ""

    return {
        "status": "success",
        "count": len(results),
        "results": results,
        "relaxed": relaxed,
        "fallback": fallback,
        "note": note,
    }


_BRAND_HARD_WHERE = [
    'o."isPublished" = true',
    "o.status IS DISTINCT FROM 'suspended'",
    'EXISTS (SELECT 1 FROM member m WHERE m."organizationId" = o.id)',
    "o.slug IS NOT NULL",
]

# Brand filters dropped first when a search is empty (aesthetic is the softest
# signal — it depends on a brand's products being tagged — then business_type,
# then city).
_BRAND_RELAX_ORDER = ["aesthetic", "business_type", "city", "name"]


async def find_brands(
    aesthetic: str | None = None,
    business_type: str | None = None,
    city: str | None = None,
    sort_by: str = "trending",
    limit: int = 5,
) -> dict:
    """Search real, published, active Dobaeni brands/sellers.

    Read-only — use this when a shopper wants a brand/store recommendation
    rather than a single product, e.g. "which store does the best streetwear".

    Graceful degradation: if the exact filters return nothing, the tool drops
    the strictest filter one at a time (aesthetic, then business_type, then
    city) until it finds brands. ``relaxed``/``fallback``/``note`` mirror
    find_products so the model can be honest about what it loosened.

    Args:
        aesthetic: Style the brand's catalog should carry, e.g. "Y2K".
        business_type: One of "Boutique", "Designer", "Streetwear", "Thrift",
            "Label", "Handmade".
        city: City filter, e.g. "Kathmandu".
        name: Brand/store name (or a close spelling of it), e.g. "Maison Lustre".
        sort_by: One of "trending", "most_followed", "top_rated".
        limit: Max rows to return (clamped to 1-10).

    Returns:
        dict: {"status": "success", "count": int, "results": [...],
        "relaxed": [str], "fallback": bool, "note": str} where each result has
        name, business_type, city, follower_count, rating_avg, product_count,
        url — or {"status": "error", "error_message": str} on failure.
    """
    limit = max(1, min(int(limit or 5), 10))
    sort_by = sort_by if sort_by in _BRAND_SORT else "trending"

    optionals: list[tuple[str, Any]] = []

    if name:
        n = f"%{name}%"
        optionals.append(("name", lambda i, n=n: (f"o.name ILIKE ${i}", i + 1, [n])))

    if aesthetic:
        a = f"%{aesthetic}%"
        optionals.append(
            (
                "aesthetic",
                lambda i, a=a: (
                    'EXISTS (SELECT 1 FROM product pp WHERE pp."organizationId" = o.id '
                    f'AND pp."isPublished" = true AND pp."styleKeywords"::text ILIKE ${i})',
                    i + 1,
                    [a],
                ),
            )
        )

    if business_type:
        bt = business_type
        optionals.append(("business_type", lambda i, bt=bt: (f'o."businessType" ILIKE ${i}', i + 1, [bt])))

    if city:
        ci = f"%{city}%"
        optionals.append(("city", lambda i, ci=ci: (f"o.city ILIKE ${i}", i + 1, [ci])))

    order_index = {name: _BRAND_RELAX_ORDER.index(name) for name, _ in optionals}
    optionals.sort(key=lambda item: order_index[item[0]])

    async def _run(active_labels: set[str]) -> list:
        where = list(_BRAND_HARD_WHERE)
        params: list[Any] = []
        idx = 1
        for label, builder in optionals:
            if label not in active_labels:
                continue
            clause, idx, oparams = builder(idx)
            where.append(clause)
            params.extend(oparams)
        if sort_by == "top_rated":
            where.append('o."ratingCount" > 0')
        params.append(limit)
        sql = f"""
            SELECT
                o.id, o.name, o.slug, o.logo, o.banner, o.description,
                o."businessType" AS business_type, o.city, o.tier,
                o."isVerified" AS is_verified, o."followerCount" AS follower_count,
                o."ratingAvg" AS rating_avg, o."ratingCount" AS rating_count,
                (SELECT COUNT(*) FROM product pp WHERE pp."organizationId" = o.id
                    AND pp."isPublished" = true) AS product_count,
                (o."followerCount" * 1 + o."ratingAvg" * o."ratingCount" * 5
                    + o."viewCount" * 0.2
                    + (SELECT COUNT(*) FROM product pp WHERE pp."organizationId" = o.id
                        AND pp."isPublished" = true) * 2) AS trend_score
            FROM organization o
            WHERE {' AND '.join(where)}
            ORDER BY {_BRAND_SORT[sort_by]}
            LIMIT ${len(params)}
        """
        pool = await get_pool()
        async with pool.acquire() as conn:
            return await conn.fetch(sql, *params)

    relaxed: list[str] = []
    fallback = False
    try:
        active = {label for label, _ in optionals}
        rows = await _run(active)
        drop_queue = [label for label, _ in optionals]
        while not rows and drop_queue:
            dropped = drop_queue.pop(0)
            relaxed.append(dropped)
            active.discard(dropped)
            rows = await _run(active)
        if not rows:
            fallback = True
            rows = await _run(set())
    except Exception as exc:  # noqa: BLE001 - surfaced to the model as a tool error
        return {"status": "error", "error_message": f"Brand lookup failed: {exc}"}

    results = [
        {
            "name": r["name"],
            "business_type": r["business_type"],
            "city": r["city"],
            "tier": r["tier"],
            "is_verified": bool(r["is_verified"]),
            "follower_count": r["follower_count"] or 0,
            "rating_avg": round(r["rating_avg"] or 0, 1),
            "rating_count": r["rating_count"] or 0,
            "product_count": r["product_count"] or 0,
            "description": r["description"],
            "url": _brand_url(r["slug"]),
        }
        for r in rows
    ]

    if fallback:
        note = "No brands matched your filters; showing popular brands instead."
    elif relaxed:
        note = "No exact match — broadened the search by ignoring: " + ", ".join(relaxed) + "."
    else:
        note = ""

    return {
        "status": "success",
        "count": len(results),
        "results": results,
        "relaxed": relaxed,
        "fallback": fallback,
        "note": note,
    }