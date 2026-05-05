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
  try {
    return await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        phone: authUser.phone ?? null,
        email: authUser.email ?? null,
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        preferredLanguage: 'hi',
        trainingConsent: true,
      },
      update: {
        // Only update fields that might have changed
        email: authUser.email ?? undefined,
        phone: authUser.phone ?? undefined,
      },
    });
  } catch (err) {
    console.error('[DB] upsertUser failed:', err);
    return null;
  }
}
