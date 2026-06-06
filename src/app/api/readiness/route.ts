import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, ...updates } = await req.json();

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates
      }
    });

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
