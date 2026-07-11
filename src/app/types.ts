export type Role =
  | 'PUBLIC'
  | 'ADMIN'
  | 'SUPER_COORDINATOR'
  | 'EVENT_COORDINATOR'
  | 'INTERNAL_JUDGE'
  | 'GUEST_JUDGE'
  | 'MENTOR'
  | 'TEAM_LEADER'
  | 'TEAM_MEMBER';

export interface RankingResponse {
  rankingId: number | null;
  teamId: number;
  teamName: string;
  categoryName?: string;
  roundId: number;
  totalScore: number;
  rankPosition: number;
  isPromoted: boolean;
}

export interface AwardCreateRequest {
  eventId: number;
  teamId: number;
  categoryId: number;
  rankingId: number | null;
  awardType: string;
  description: string;
}

export interface AwardResponse {
  awardId: number;
  eventId: number;
  teamId: number;
  teamName: string;
  awardType: string;
  description: string;
  awardedBy: number;
  awardedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}



export type Screen = string;

