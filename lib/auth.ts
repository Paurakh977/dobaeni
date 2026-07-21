import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor, username, organization, admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// ── Environment ─────────────────────────────────────────────
function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required)
    throw new Error(`Missing required environment variable: ${name}`);
  return undefined;
}

const baseURL = getEnv('BETTER_AUTH_URL') as string;
const appURL =
  getEnv('NEXT_PUBLIC_APP_URL', false) ?? baseURL;
const secret = getEnv('BETTER_AUTH_SECRET') as string;
const appName = getEnv('APP_NAME', false) ?? 'Dobaeni';

const googleClientId = getEnv('GOOGLE_CLIENT_ID', false);
const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET', false);
const githubClientId = getEnv('GITHUB_CLIENT_ID', false);
const githubClientSecret = getEnv('GITHUB_CLIENT_SECRET', false);

const hasGoogle = Boolean(googleClientId && googleClientSecret);
const hasGithub = Boolean(githubClientId && githubClientSecret);

// Email verification is only enforced when we can actually send mail.
const canSendEmail = Boolean(process.env.RESEND_API_KEY?.trim());

export const auth = betterAuth({
  appName,
  baseURL,
  secret,

  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: canSendEmail,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password — Dobaeni',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#1e293b">Reset your password</h2>
            <p style="color:#64748b">Click the button below to set a new password for your account.</p>
            <a href="${url}"
               style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#94a3b8;font-size:12px">
              This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      }).catch((error: unknown) => {
        console.error('[Email Delivery Error] reset_password', error);
      });
    },
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email — Dobaeni',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#1e293b">Verify your email</h2>
            <p style="color:#64748b">Click below to verify your email and activate your account.</p>
            <a href="${url}"
              style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Verify Email
            </a>
            <p style="color:#94a3b8;font-size:12px">
              This link expires in 24 hours. If you didn't sign up, ignore this email.
            </p>
          </div>
        `,
      }).catch((error: unknown) => {
        console.error('[Email Delivery Error] verification_email', error);
      });
    },
    sendOnSignUp: true,
    callbackURL: `${appURL}/auth/verify-email`,
  },

  socialProviders: {
    ...(hasGoogle
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            prompt: 'select_account',
          },
        }
      : {}),
    ...(hasGithub
      ? {
          github: {
            clientId: githubClientId as string,
            clientSecret: githubClientSecret as string,
          },
        }
      : {}),
  },

  session: {
    // Persist sessions in the DB so they're queryable and revocable.
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    freshAge: 60 * 15, // 15 minutes for destructive actions
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 3 },
      '/request-password-reset': { window: 60, max: 3 },
      '/send-verification-email': { window: 60, max: 3 },
      '/two-factor/send-otp': { window: 60, max: 3 },
      '/two-factor/verify-totp': { window: 10, max: 3 },
      '/two-factor/verify-otp': { window: 10, max: 3 },
      '/two-factor/verify-backup-code': { window: 10, max: 3 },
      '/change-password': { window: 60, max: 5 },
      '/change-email': { window: 60, max: 3 },
      '/reset-password': { window: 60, max: 5 },
      '/delete-user': { window: 60, max: 2 },
    },
  },

  trustedOrigins: Array.from(
    new Set([
      ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
      appURL,
      ...(getEnv('TRUSTED_ORIGINS', false)
        ?.split(',')
        .map((o) => o.trim())
        .filter(Boolean) ?? []),
    ]),
  ),

  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      // Global platform role. Also read by the `admin()` plugin for access
      // control (adminRoles = admin | moderator). `additionalFields` are merged
      // after plugin schemas, so input stays true and sign-up may set it.
      role: {
        type: 'string',
        required: false,
        defaultValue: 'buyer',
      },
      interests: {
        type: 'string', // JSON string array of interests
        required: false,
      },
      onboardingCompleted: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      }
    }
  },

  advanced: {
    // Behind TLS in production. Set true when deploying.
    useSecureCookies: process.env.NODE_ENV === 'production',
    ipAddress: {
      disableIpTracking: false,
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
    },
    backgroundTasks: {
      handler: (promise) => {
        void promise.catch((e: unknown) =>
          console.error('[Better Auth] Background task failed:', e),
        );
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),

    // ── Platform admin / RBAC ──────────────────────────────────────────────
    // `role` (declared in user.additionalFields below) doubles as the global
    // platform role (buyer | seller | moderator | admin). `banned` / `banReason`
    // / `banExpires` are added by this plugin and enforced by its session hook
    // (banned users cannot sign in and their sessions are rejected). `role`
    // stays user-settable via additionalFields so the sign-up form can still
    // pick buyer vs seller.
    admin({
      defaultRole: 'buyer',
      adminRoles: ['admin'],
      bannedUserMessage:
        'Your account has been suspended by the Dobaeni team. Contact support if you believe this is an error.',
    }),

    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      schema: {
        organization: {
          additionalFields: {
            banner: { type: 'string', required: false },
            description: { type: 'string', required: false },
            contactEmail: { type: 'string', required: false },
            contactPhone: { type: 'string', required: false },
            status: { type: 'string', required: false, defaultValue: 'active' },

            // Extended brand profile (mirrors prisma/schema.prisma Organization)
            legalName: { type: 'string', required: false },
            address: { type: 'string', required: false },
            city: { type: 'string', required: false },
            country: { type: 'string', required: false, defaultValue: 'Nepal' },
            latitude: { type: 'number', required: false },
            longitude: { type: 'number', required: false },
            businessType: { type: 'string', required: false },
            websiteUrl: { type: 'string', required: false },
            socialLinks: { type: 'string', required: false },
            establishedYear: { type: 'number', required: false },
            taxId: { type: 'string', required: false },
            verificationStatus: { type: 'string', required: false, defaultValue: 'unverified' },
            isVerified: { type: 'boolean', required: false, defaultValue: false },
            isPublished: { type: 'boolean', required: false, defaultValue: true },
            shippingPolicy: { type: 'string', required: false },
            returnPolicy: { type: 'string', required: false },
            tier: { type: 'string', required: false, defaultValue: 'none' },
          }
        }
      }
    }),

    twoFactor({
      // Allow OAuth / passkey / email-OTP users (no credential password) to
      // enable & manage 2FA. For these users the password step is skipped.
      allowPasswordless: true,
      issuer: appName,
      totpOptions: {
        digits: 6,
        period: 30,
      },
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          await sendEmail({
            to: user.email,
            subject: 'Your verification code — Dobaeni',
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <h2 style="color:#1e293b">Your verification code</h2>
                <p style="color:#64748b">Use this code to complete sign-in. It expires in 3 minutes.</p>
                <div style="font-size:36px;font-weight:700;letter-spacing:8px;
                            color:#6366f1;padding:16px 0">
                  ${otp}
                </div>
                <p style="color:#94a3b8;font-size:12px">
                  If you didn't request this code, ignore this email.
                </p>
              </div>
            `,
          }).catch((error: unknown) => {
            console.error('[Email Delivery Error] two_factor_otp', error);
          });
        },
        storeOTP: 'encrypted',
        period: 3,
        allowedAttempts: 5,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: 'encrypted',
      },
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 60 * 60 * 24 * 30,
    }),

    // Must be last for Next.js so Set-Cookie headers from auth.api.* calls
    // (e.g. signOut / deleteUser) are applied to the response.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
