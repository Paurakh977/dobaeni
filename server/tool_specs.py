#!/usr/bin/env python3
"""
tool_specs.py
=============

The "menu" of tools handed to litellm.completion(tools=..., tool_choice=...).
This is the standard OpenAI-compatible function-calling shape (also what
litellm normalizes every provider to), which is why it looks a little more
verbose than an ADK @Tool-decorated function — there's no framework doing the
schema generation for us here, so we write the JSON schema by hand.

TOOL_IMPL maps each tool's name to the actual async function that runs it
(see db_tools.py) so app.py can dispatch a tool_call -> real function call
by name without a big if/elif chain.
"""

from db_tools import find_brands, find_products

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "find_products",
            "description": (
                "Search Dobaeni's real, in-stock, published product catalog. "
                "Use this BEFORE recommending any specific product, outfit "
                "idea, or answering 'what should I buy/wear' style questions. "
                "Never invent a product, price, or link — always call this "
                "first and only describe what it returns."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Free-text search, e.g. 'linen shirt'. Optional.",
                    },
                    "aesthetics": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "Style/aesthetic tags to match. Use EXACT tags from "
                            "this catalog's vocabulary: Old Money, Minimalist, "
                            "Clean Girl, Streetwear, Y2K, Athleisure, Boho, "
                            "Cottagecore, Vintage, Gothic, Avant-Garde, Korean, "
                            "Office Wear, Preppy, Coquette. Any one match is "
                            "enough. e.g. ['Boho'] or ['Old Money','Minimalist']. Optional."
                        ),
                    },
                    "category": {
                        "type": "string",
                        "description": (
                            "A type of item the shopper said, e.g. 'Dresses', "
                            "'Kurta', 'Hoodie', 'Blazer', 'Lehenga', 'Sneakers'. "
                            "Matched against product names/tags (not a strict "
                            "category table), so 'Dresses' finds wrap/slip/blazer "
                            "dresses. Optional."
                        ),
                    },
                    "gender": {
                        "type": "string",
                        "enum": ["male", "female", "unisex"],
                        "description": "Optional gender filter.",
                    },
                    "occasion": {
                        "type": "string",
                        "description": "e.g. 'Wedding', 'Work', 'Party', 'Daily'. Optional.",
                    },
                    "min_price": {
                        "type": "number",
                        "description": "Minimum price in NPR. Optional.",
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Maximum price in NPR. Optional.",
                    },
                    "sort_by": {
                        "type": "string",
                        "enum": ["trending", "rating", "newest", "price_low", "price_high"],
                        "description": "Ranking metric. Defaults to 'trending'.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results to return, 1-12. Defaults to 6.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_brands",
            "description": (
                "Search Dobaeni's real, published, active brands/sellers. Use "
                "this when a shopper wants a brand or store recommendation "
                "rather than a single product, e.g. 'which brand has the best "
                "streetwear'. Never invent a brand name or link."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "aesthetic": {
                        "type": "string",
                        "description": "Style the brand's catalog should carry, e.g. 'Y2K'. Optional.",
                    },
                    "name": {
                        "type": "string",
                        "description": (
                            "Brand/store name (or a close spelling of it), e.g. "
                            "'Maison Lustre', 'Neon Kathmandu'. Matched loosely "
                            "so minor typos still resolve to the right seller. Optional."
                        ),
                    },
                    "business_type": {
                        "type": "string",
                        "description": (
                            "One of Boutique, Designer, Streetwear, Thrift, "
                            "Label, Handmade. Optional."
                        ),
                    },
                    "city": {
                        "type": "string",
                        "description": "e.g. 'Kathmandu'. Optional.",
                    },
                    "sort_by": {
                        "type": "string",
                        "enum": ["trending", "most_followed", "top_rated"],
                        "description": "Ranking metric. Defaults to 'trending'.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results to return, 1-10. Defaults to 5.",
                    },
                },
                "required": [],
            },
        },
    },
]

TOOL_IMPL = {
    "find_products": find_products,
    "find_brands": find_brands,
}