import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface Discipline {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
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

export async function getDisciplines(includeInactive = false): Promise<Discipline[]> {
  const res = await apiClient.get<ApiResponse<Discipline[]>>('/api/disciplines', {
    params: includeInactive ? { includeInactive: true } : {},
  });
  return res.data.data ?? [];
}

export async function getTermPlans(disciplineId?: number): Promise<TermPlan[]> {
  const params = disciplineId !== undefined ? { disciplineId } : {};
  const res = await apiClient.get<ApiResponse<TermPlan[]>>('/api/term-plans', { params });
  return res.data.data ?? [];
}

// ── Governance writes (Super Coordinator) — FR-GOV-01 / FR-GOV-02 ──────────────
export interface CreateDisciplineRequest { code: string; name: string; description?: string; }
export interface UpdateDisciplineRequest { name?: string; description?: string; active?: boolean; }

export async function createDiscipline(req: CreateDisciplineRequest): Promise<Discipline> {
  const res = await apiClient.post<ApiResponse<Discipline>>('/api/disciplines', req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create discipline failed');
  return data;
}

export async function updateDiscipline(id: number, req: UpdateDisciplineRequest): Promise<Discipline> {
  const res = await apiClient.patch<ApiResponse<Discipline>>(`/api/disciplines/${id}`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update discipline failed');
  return data;
}

export interface CreateTermPlanRequest {
  term: 'SPRING' | 'SUMMER' | 'FALL';
  year: number;
  disciplineId: number;
  maxEvents: number;
}

export async function createTermPlan(req: CreateTermPlanRequest): Promise<TermPlan> {
  const res = await apiClient.post<ApiResponse<TermPlan>>('/api/term-plans', req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create term plan failed');
  return data;
}

export async function updateTermPlan(id: number, maxEvents: number): Promise<TermPlan> {
  const res = await apiClient.patch<ApiResponse<TermPlan>>(`/api/term-plans/${id}`, { maxEvents });
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update term plan failed');
  return data;
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
