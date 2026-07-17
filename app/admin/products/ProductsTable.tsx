'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star, StarOff, Eye, EyeOff } from 'lucide-react';

export type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  currency: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  organization: { id: string; name: string; slug: string | null; isPublished: boolean; status: string | null };
  image: string | null;
};

export default function ProductsTable({
  products,
  canModerate,
  canFeature,
}: {
  products: ProductRow[];
  canModerate: boolean;
  canFeature: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {msg && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
          {msg}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-[#7C7C83]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const brandHidden = !p.organization.isPublished || p.organization.status === 'suspended';
              return (
                <tr key={p.id} className="border-t border-white/[0.04]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1f]">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="truncate text-[#FAF9F6]">{p.name}</p>
                      {p.isFeatured && (
                        <span className="rounded-full bg-[#DFBA73]/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73]">
                          featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate text-[12px] text-[#8E8E93]">{p.organization.name}</p>
                    {brandHidden && (
                      <p className="text-[10px] text-amber-400/80">brand {p.organization.status === 'suspended' ? 'suspended' : 'unlisted'}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#8E8E93]">
                    {p.currency} {p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {p.isPublished ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        published
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canModerate &&
                        (p.isPublished ? (
                          <button
                            onClick={() => act(p.id, 'publish', { published: false })}
                            disabled={busyId === p.id}
                            title="Unpublish"
                            className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-zinc-300 disabled:opacity-40"
                          >
                            {busyId === p.id ? <Loader2 size={15} className="animate-spin" /> : <EyeOff size={15} />}
                          </button>
                        ) : (
                          <button
                            onClick={() => act(p.id, 'publish', { published: true })}
                            disabled={busyId === p.id}
                            title="Publish"
                            className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-emerald-400 disabled:opacity-40"
                          >
                            {busyId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                          </button>
                        ))}
                      {canFeature &&
                        (p.isFeatured ? (
                          <button
                            onClick={() => act(p.id, 'feature', { featured: false })}
                            disabled={busyId === p.id}
                            title="Unfeature"
                            className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-zinc-300 disabled:opacity-40"
                          >
                            {busyId === p.id ? <Loader2 size={15} className="animate-spin" /> : <StarOff size={15} />}
                          </button>
                        ) : (
                          <button
                            onClick={() => act(p.id, 'feature', { featured: true })}
                            disabled={busyId === p.id}
                            title="Feature on discover"
                            className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-[#DFBA73] disabled:opacity-40"
                          >
                            {busyId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
