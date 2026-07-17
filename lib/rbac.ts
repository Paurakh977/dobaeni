// Platform RBAC for the Dobaeni admin console.
//
// Two orthogonal concepts live here:
//   1. The global platform `role` on the User (buyer | seller | moderator | admin).
//      This is owned by Better Auth's `admin()` plugin and stored in `user.role`.
//   2. Fine-grained `Permission`s that gate individual admin actions. Moderators
//      get a restricted subset; admins get everything.
//
// Note: `buyer` / `seller` are not admin roles, so they can never reach the
// admin console (see lib/admin-auth.ts -> isAdminRole).

export type Role = 'buyer' | 'seller' | 'moderator' | 'admin';

export type Permission =
  | 'admin:access'
  | 'user:read'
  | 'user:ban'
  | 'user:unban'
  | 'user:set-role'
  | 'user:impersonate'
  | 'brand:read'
  | 'brand:verify'
  | 'brand:publish'
  | 'brand:suspend'
  | 'brand:lock-analytics'
  | 'product:read'
  | 'product:moderate'
  | 'product:feature';

// Roles that may enter the admin console at all.
export const ADMIN_ROLES = ['admin', 'moderator'] as const;

// Permissions granted per role.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  buyer: [],
  seller: [],
  // Moderators keep the marketplace healthy but cannot touch accounts/admins.
  moderator: [
    'admin:access',
    'user:read',
    'brand:read',
    'brand:verify',
    'brand:publish',
    'brand:suspend',
    'brand:lock-analytics',
    'product:read',
    'product:moderate',
    'product:feature',
  ],
  // Admins have full control, including account bans, role changes and
  // impersonation.
  admin: [
    'admin:access',
    'user:read',
    'user:ban',
    'user:unban',
    'user:set-role',
    'user:impersonate',
    'brand:read',
    'brand:verify',
    'brand:publish',
    'brand:suspend',
    'brand:lock-analytics',
    'product:read',
    'product:moderate',
    'product:feature',
  ],
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role as Role]?.includes(permission) ?? false;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export const ALL_ROLES: Role[] = ['buyer', 'seller', 'moderator', 'admin'];
