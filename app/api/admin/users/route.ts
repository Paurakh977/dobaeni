import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import { listUsers } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  const session = await authorizeApi('user:read');
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await listUsers();
  return NextResponse.json({ users });
}
