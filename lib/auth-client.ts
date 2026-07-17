'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient, usernameClient, organizationClient, adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    usernameClient(),
    organizationClient(),
    adminClient(),
    twoFactorClient({
      // When a 2FA step is required during sign-in, redirect here.
      onTwoFactorRedirect() {
        window.location.href = '/2fa';
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
