import 'server-only';

import { getSessionContext } from '@/lib/auth';
import { FitProfileRepository } from '@/lib/fit/FitProfileRepository';
import type {
  FitProfileCreateInput,
  FitProfileSummary,
  FitProfileUpdateInput,
} from '@/lib/fit/FitProfileSchema';

export type FitProfileOwnerContext = {
  email: string;
  customerId?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function getOptionalOwnerContext(): Promise<FitProfileOwnerContext | null> {
  try {
    const session = await getSessionContext();
    return {
      email: normalizeEmail(session.email),
      customerId: session.customerId || undefined,
    };
  } catch {
    return null;
  }
}

export const FitProfileService = {
  getOptionalOwnerContext,

  async requireOwnerContext(): Promise<FitProfileOwnerContext> {
    const owner = await getOptionalOwnerContext();
    if (!owner) {
      throw new Error('unauthorized');
    }
    return owner;
  },

  async listProfilesForCurrentOwner(): Promise<FitProfileSummary[]> {
    const owner = await this.requireOwnerContext();
    return FitProfileRepository.listOwnedProfiles(owner);
  },

  async getProfileForCurrentOwner(id: string): Promise<FitProfileSummary | null> {
    const owner = await this.requireOwnerContext();
    return FitProfileRepository.findOwnedProfileById(id, owner);
  },

  async saveProfile(input: FitProfileCreateInput): Promise<FitProfileSummary> {
    const sessionOwner = await getOptionalOwnerContext();
    const providedEmail = input.email ? normalizeEmail(input.email) : '';

    if (sessionOwner && providedEmail && providedEmail !== sessionOwner.email) {
      throw new Error('forbidden');
    }

    const owner = sessionOwner || (providedEmail ? { email: providedEmail } : null);
    if (!owner) {
      throw new Error('email_required');
    }

    return FitProfileRepository.saveProfile(owner, {
      ...input,
      email: owner.email,
    });
  },

  async updateProfile(id: string, input: FitProfileUpdateInput): Promise<FitProfileSummary | null> {
    const owner = await this.requireOwnerContext();
    return FitProfileRepository.updateOwnedProfile(id, owner, input);
  },
};
