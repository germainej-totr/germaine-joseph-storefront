'use client';

import { useEffect, useState } from 'react';

import type { FitProfile } from '@/types/fit';

type UseFitProfileOptions = {
  profileId?: string | null;
  initialProfile?: FitProfile | null;
  initialProfiles?: FitProfile[];
  enabled?: boolean;
};

export function useFitProfile(options: UseFitProfileOptions = {}) {
  const { profileId, initialProfile = null, initialProfiles = [], enabled = true } = options;
  const [profile, setProfile] = useState<FitProfile | null>(initialProfile);
  const [profiles, setProfiles] = useState<FitProfile[]>(initialProfiles);
  const [isLoading, setIsLoading] = useState(enabled && !initialProfile && initialProfiles.length === 0);
  const [error, setError] = useState<string>('');

  async function refresh() {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const endpoint = profileId ? `/api/fit/profile/${encodeURIComponent(profileId)}` : '/api/fit/profile';
      const response = await fetch(endpoint, { cache: 'no-store' });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        profile?: FitProfile;
        profiles?: FitProfile[];
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to load fit profile');
      }

      if (profileId) {
        setProfile(payload.profile || null);
      } else {
        setProfiles(payload.profiles || []);
        setProfile((payload.profiles || [])[0] || null);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load fit profile');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [profileId, enabled]);

  return {
    profile,
    profiles,
    isLoading,
    error,
    refresh,
  };
}
