import { redirect } from 'next/navigation';
import { getSession } from './get-session';
import { hasPermission, isAdminRole, type Permission } from './rbac';
import type { Session } from './auth';

// ── Page guards (server components) ────────────────────────────────────────
// These redirect on failure, so they must only be called from Server
// Components / Server Actions (not Route Handlers).

/** Returns the session only if the user is an admin/moderator, else null. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;
  if (!isAdminRole(session.user.role)) return null;
  return session;
}

/** Requires an authenticated admin/moderator, redirecting otherwise. */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!isAdminRole(session.user.role)) redirect('/forbidden');
  return session;
}

/** Requires an authenticated admin/moderator with a specific permission. */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireAdmin();
  if (!hasPermission(session.user.role, permission)) redirect('/forbidden');
  return session;
}

// ── API guards (route handlers) ─────────────────────────────────────────────
// These return `null` on failure so the caller can send a 403 JSON response.

export async function authorizeApi(permission: Permission): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;
  if (!isAdminRole(session.user.role)) return null;
  if (!hasPermission(session.user.role, permission)) return null;
  return session;
}
