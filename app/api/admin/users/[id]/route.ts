import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import { banUser, unbanUser, setUserRole } from '@/lib/admin';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  const permission =
    action === 'ban' ? 'user:ban'
    : action === 'unban' ? 'user:unban'
    : action === 'set-role' ? 'user:set-role'
    : null;
  if (!permission) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const session = await authorizeApi(permission);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    if (action === 'ban') {
      if (id === session.user.id)
        return NextResponse.json({ error: 'You cannot ban yourself' }, { status: 400 });
      await banUser(id, body.reason || undefined, body.banExpiresIn ? Number(body.banExpiresIn) : undefined);
    } else if (action === 'unban') {
      await unbanUser(id);
    } else if (action === 'set-role') {
      if (id === session.user.id)
        return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
      const role = String(body.role);
      if (!['buyer', 'seller', 'moderator', 'admin'].includes(role))
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      await setUserRole(id, role);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
