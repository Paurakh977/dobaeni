import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import { setProductPublished, setProductFeatured, deleteProduct } from '@/lib/admin';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await authorizeApi('product:moderate');
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  const permission =
    action === 'publish' ? 'product:moderate'
    : action === 'feature' ? 'product:feature'
    : null;
  if (!permission) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const session = await authorizeApi(permission);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    if (action === 'publish') {
      await setProductPublished(id, body.published !== false);
    } else if (action === 'feature') {
      await setProductFeatured(id, body.featured === true);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
