/**
 * FirstReport — Sync Supabase Auth user to Prisma User table.
 * Called once after login / OTP verification.
 * Uses upsert so it's safe to call multiple times.
 */

import prisma from '@/lib/prisma';

export interface AuthUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string };
}

export async function upsertUser(authUser: AuthUser) {
  // Resolve display name from Google OAuth / OTP user_metadata
  const resolvedName =
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    null;

  try {
    return await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id:                authUser.id,
        phone:             authUser.phone ?? null,
        email:             authUser.email ?? null,
        name:              resolvedName,
        preferredLanguage: 'hi',
        trainingConsent:   true,
      },
      update: {
        // FIX: always update name from real auth metadata.
        // createSession() leaves name=null (placeholder). upsertUser() is the
        // authoritative source of the display name after actual sign-in.
        // Spread conditionally so undefined values don't overwrite good data.
        ...(resolvedName               ? { name:  resolvedName }       : {}),
        ...(authUser.email             ? { email: authUser.email }     : {}),
        ...(authUser.phone             ? { phone: authUser.phone }     : {}),
      },
    });
  } catch (err) {
    console.error('[DB] upsertUser failed:', err);
    return null;
  }
}
