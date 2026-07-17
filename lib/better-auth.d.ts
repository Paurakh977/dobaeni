import "better-auth";

// Module augmentation so Better Auth's inferred `User` / `Session` types know
// about our custom fields (declared in `user.additionalFields` in lib/auth.ts
// and by the `admin()` plugin). Without this, `auth.api`/`authClient` calls
// that set these fields (e.g. sign-up `role`, `onboardingCompleted`) fail to
// type-check.
declare module "better-auth" {
   interface User {
    role?: string | null;
    interests?: string | null;
    onboardingCompleted?: boolean | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
  }

  interface Session {
    impersonatedBy?: string | null;
  }
}

declare module "better-auth/client" {
  interface User {
    role?: string | null;
    interests?: string | null;
    onboardingCompleted?: boolean | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
  }

  interface Session {
    impersonatedBy?: string | null;
  }
}
