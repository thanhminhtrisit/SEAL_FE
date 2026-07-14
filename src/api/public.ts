import { apiClient } from './client';
import type { ApiResponse } from './types';

// Public landing-page data — served by GET /api/public/landing (no auth required).
export interface LandingStats {
  openEvents: number;
  registeredTeams: number;
  categories: number;
  judges: number;
}

export interface LandingEvent {
  id: number;
  name: string;
  disciplineName: string | null;
  eventType: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  maxTeams: number | null;
  registeredTeams: number;
  categories: string[];
}

export interface LandingData {
  stats: LandingStats;
  events: LandingEvent[];
}

const EMPTY: LandingData = {
  stats: { openEvents: 0, registeredTeams: 0, categories: 0, judges: 0 },
  events: [],
};

export async function getLanding(): Promise<LandingData> {
  const res = await apiClient.get<ApiResponse<LandingData>>('/api/public/landing');
  return res.data.data ?? EMPTY;
}
