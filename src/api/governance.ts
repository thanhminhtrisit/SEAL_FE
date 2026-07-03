import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface Discipline {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface TermPlan {
  id: number;
  term: 'SPRING' | 'SUMMER' | 'FALL';
  year: number;
  disciplineId: number;
  disciplineName: string;
  maxEvents: number;
  usedEvents: number;
  remaining: number;
}

export interface BudgetCategory {
  id: number;
  name: string;
  code?: string;
}

export async function getDisciplines(): Promise<Discipline[]> {
  const res = await apiClient.get<ApiResponse<Discipline[]>>('/api/disciplines');
  return res.data.data ?? [];
}

export async function getTermPlans(disciplineId?: number): Promise<TermPlan[]> {
  const params = disciplineId !== undefined ? { disciplineId } : {};
  const res = await apiClient.get<ApiResponse<TermPlan[]>>('/api/term-plans', { params });
  return res.data.data ?? [];
}

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  const res = await apiClient.get<ApiResponse<BudgetCategory[]>>('/api/budget-categories');
  return res.data.data ?? [];
}

// Module 2 — User Directory: mentors active list for category assignment
export interface Mentor {
  id: number;
  fullName: string;
  email: string;
}

export async function getMentors(): Promise<Mentor[]> {
  const res = await apiClient.get<ApiResponse<Mentor[]>>('/api/mentors');
  return res.data.data ?? [];
}
