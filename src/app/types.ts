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
  roundId: number;
  totalScore: number;
  rankPosition: number;
  isPromoted: boolean;
}


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
export type Screen = string;
