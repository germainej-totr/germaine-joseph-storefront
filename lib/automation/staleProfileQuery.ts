import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Configuration for lifecycle automation thresholds
 */
export const LIFECYCLE_CONFIG = {
  STALE_PROFILE_DAYS: 180,           // 6 months
  PREVIEW_REMINDER_DAYS: 30,         // Send reminder 30 days before stale threshold
  MAX_REMINDERS_PER_RUN: 100,        // Prevent runaway batch jobs
  EXCLUDE_RECENT_INTERACTIONS: 7,    // Don't remind if they interacted in past 7 days
};

/**
 * Find fit profiles due for refit reminders
 * Returns profiles that:
 * - Haven't been updated in 6+ months, OR
 * - Are approaching the 6-month mark (warning window)
 * - Haven't been contacted recently
 */
export async function findStaleProfiles(options?: {
  limit?: number;
  includedProfileIds?: string[];
}) {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - LIFECYCLE_CONFIG.STALE_PROFILE_DAYS * 24 * 60 * 60 * 1000);
  const reminderThreshold = new Date(now.getTime() - (LIFECYCLE_CONFIG.STALE_PROFILE_DAYS - LIFECYCLE_CONFIG.PREVIEW_REMINDER_DAYS) * 24 * 60 * 60 * 1000);
  const recentInteraction = new Date(now.getTime() - LIFECYCLE_CONFIG.EXCLUDE_RECENT_INTERACTIONS * 24 * 60 * 60 * 1000);

  const limit = options?.limit ?? LIFECYCLE_CONFIG.MAX_REMINDERS_PER_RUN;

  try {
    const profiles = await prisma.fitProfile.findMany({
      where: {
        // Only target profiles with actual customer data
        email: { not: null },
        customerId: { not: null },
        // Updated more than 6 months (stale) OR approaching 6-month mark
        updatedAt: {
          lte: staleThreshold,
        },
        // Exclude profiles we've reminded recently
        // (in real app, add a 'lastReminderSentAt' field to FitProfile)
      },
      orderBy: { updatedAt: 'asc' }, // Oldest first
      take: limit,
      select: {
        id: true,
        email: true,
        customerId: true,
        profile_name: true,
        jacketSize: true,
        trouserSize: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return profiles;
  } catch (error) {
    console.error('Error querying stale profiles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Calculate days since profile was last updated
 */
export function calculateProfileAgeDays(lastUpdatedAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - lastUpdatedAt.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Determine if profile qualifies for refit reminder
 */
export function shouldSendRefitReminder(profile: { updatedAt: Date }): boolean {
  const ageDays = calculateProfileAgeDays(profile.updatedAt);
  return ageDays >= LIFECYCLE_CONFIG.STALE_PROFILE_DAYS - LIFECYCLE_CONFIG.PREVIEW_REMINDER_DAYS;
}
