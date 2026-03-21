import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { resolveMtmEntryPath } from '@/lib/fit/resolveMtmEntryPath';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fitProfileId = searchParams.get('fitProfileId');

  let sessionEmail = '';
  let sessionCustomerId = '';

  try {
    const session = await getSessionContext();
    sessionEmail = session.email;
    sessionCustomerId = session.customerId;
  } catch {
    const decision = resolveMtmEntryPath({
      hasAccount: false,
      hasFitProfile: false,
    });

    return NextResponse.json(
      {
        ...decision,
        reason: 'unauthenticated',
        fitProfileId: null,
        updatedAt: null,
      },
      { status: 401 },
    );
  }

  if (!fitProfileId) {
    const decision = resolveMtmEntryPath({
      hasAccount: true,
      hasFitProfile: false,
    });

    return NextResponse.json({
      ...decision,
      fitProfileId: null,
      updatedAt: null,
    });
  }

  const profile = await prisma.fitProfile.findUnique({
    where: { id: fitProfileId },
    select: {
      id: true,
      customerId: true,
      updatedAt: true,
      email: true,
      isActive: true,
    },
  });

  if (!profile || !profile.isActive) {
    const decision = resolveMtmEntryPath({
      hasAccount: true,
      hasFitProfile: false,
    });

    return NextResponse.json({
      ...decision,
      fitProfileId: null,
      updatedAt: null,
    });
  }

  // Strict ownership check: prefer explicit customerId match, with email fallback for legacy rows.
  const ownedByCustomerId = !!profile.customerId && profile.customerId === sessionCustomerId;
  const ownedByEmail = profile.email.toLowerCase() === sessionEmail;
  if (!ownedByCustomerId && !ownedByEmail) {
    const decision = resolveMtmEntryPath({
      hasAccount: true,
      hasFitProfile: false,
    });

    return NextResponse.json(
      {
        ...decision,
        reason: 'profile_not_owned',
        fitProfileId: null,
        updatedAt: null,
      },
      { status: 403 },
    );
  }

  const decision = resolveMtmEntryPath({
    hasAccount: true,
    hasFitProfile: true,
    fitProfileUpdatedAt: profile.updatedAt,
  });

  return NextResponse.json({
    ...decision,
    fitProfileId: profile.id,
    updatedAt: profile.updatedAt.toISOString(),
    email: profile.email,
    customerId: sessionCustomerId,
  });
}
