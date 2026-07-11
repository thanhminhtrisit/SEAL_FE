import { apiClient } from './client';
import type { ApiResponse } from './types';
import axios from 'axios';

export type EventType = 'SPRING' | 'SUMMER' | 'FALL' | 'SPECIAL';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'REJECTED';

export interface EventSummary {
  id: number;
  name: string;
  slug: string;
  eventType: EventType;
  status: EventStatus;
  registrationStart: string | null;
  registrationEnd: string | null;
  // Present on detail responses (create/get/patch/submit/approve/open/reject)
  description?: string | null;
  disciplineId?: number;
  disciplineName?: string | null;
  termPlanId?: number;
  ownerCoordinatorId?: number | null;
  maxTeamSize?: number | null;
  maxTeams?: number | null;
  maxParticipants?: number | null;
  maxTeamsPerMentor?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
  name: string;
  disciplineId: number;
  termPlanId: number;
  eventType: EventType;
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
}

export interface EventRound {
  id: number;
  eventId?: number;
  name: string;
  orderNumber: number;
  status: string;
  submissionDeadline?: string | null;
  scoringDeadline?: string | null;
  promotionTopN?: number | null;
  finalRound?: boolean;
  requiresRepo?: boolean;
  requiresDemo?: boolean;
  requiresSlide?: boolean;
  requiresReport?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventCategory {
  id: number;
  eventId?: number;
  name: string;
  description?: string | null;
  mentorId?: number | null;
  mentorName?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriterionItem {
  id: number;
  criteriaSetId?: number;
  name: string;
  maxScore: number;
  weight: number;
  description?: string | null;
  displayOrder?: number | null;
  active?: boolean;
}

export interface CriteriaSet {
  id: number;
  name: string;
  description?: string | null;
  eventId?: number;
  roundId?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
  promotionTopN?: number | null;
  template?: boolean;
  defaultSet?: boolean;
  criteria?: CriterionItem[];
}

export async function getEvents(status?: EventStatus): Promise<EventSummary[]> {
  const res = await apiClient.get<ApiResponse<EventSummary[]>>('/api/events', {
    params: status ? { status } : undefined,
  });
  return res.data.data ?? [];
}

export async function getEvent(id: number): Promise<EventSummary> {
  const res = await apiClient.get<ApiResponse<EventSummary>>(`/api/events/${id}`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Event not found');
  return data;
}

export async function createEvent(req: CreateEventRequest): Promise<EventSummary> {
  const res = await apiClient.post<ApiResponse<EventSummary>>('/api/events', req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create event failed');
  return data;
}

export async function getEventRounds(eventId: number): Promise<EventRound[]> {
  const res = await apiClient.get<ApiResponse<EventRound[]>>(`/api/events/${eventId}/rounds`);
  return res.data.data ?? [];
}

export async function getEventCategories(eventId: number): Promise<EventCategory[]> {
  const res = await apiClient.get<ApiResponse<EventCategory[]>>(`/api/events/${eventId}/categories`);
  return res.data.data ?? [];
}

export async function getEventCriteriaSets(eventId: number): Promise<CriteriaSet[]> {
  const res = await apiClient.get<ApiResponse<CriteriaSet[]>>(`/api/events/${eventId}/criteria-sets`);
  return res.data.data ?? [];
}

// ── Write APIs (wizard) ───────────────────────────────────────────────────────

export interface CreateRoundRequest {
  name: string;
  orderNumber: number;
  submissionDeadline?: string;
  scoringDeadline?: string;
  promotionTopN?: number;
  finalRound: boolean;
  requiresRepo?: boolean;
  requiresDemo?: boolean;
  requiresSlide?: boolean;
  requiresReport?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  mentorId?: number | null;
}

export interface CreateCriteriaSetRequest {
  name: string;
  description?: string;
  roundId?: number | null;
  categoryId?: number | null;
  promotionTopN?: number | null;
  criteria: {
    name: string;
    description?: string;
    maxScore: number;
    weight: number;
    displayOrder: number;
  }[];
}

export interface CreateBudgetRequest {
  currency: string;
}

export interface BudgetResponse {
  id: number;
  eventId?: number;
  currency: string;
  totalEstimatedCost?: number;
  status?: string;
  items?: BudgetItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBudgetItemRequest {
  categoryId: number;
  description: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export async function createRound(eventId: number, req: CreateRoundRequest): Promise<EventRound> {
  const res = await apiClient.post<ApiResponse<EventRound>>(`/api/events/${eventId}/rounds`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create round failed');
  return data;
}

export async function createCategory(eventId: number, req: CreateCategoryRequest): Promise<EventCategory> {
  const res = await apiClient.post<ApiResponse<EventCategory>>(`/api/events/${eventId}/categories`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create category failed');
  return data;
}

export async function createCriteriaSet(eventId: number, req: CreateCriteriaSetRequest): Promise<CriteriaSet> {
  const res = await apiClient.post<ApiResponse<CriteriaSet>>(`/api/events/${eventId}/criteria-sets`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create criteria set failed');
  return data;
}

export async function createBudget(eventId: number, req: CreateBudgetRequest): Promise<BudgetResponse> {
  const res = await apiClient.post<ApiResponse<BudgetResponse>>(`/api/events/${eventId}/budget`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create budget failed');
  return data;
}

export async function createBudgetItem(eventId: number, req: CreateBudgetItemRequest): Promise<BudgetResponse> {
  const res = await apiClient.post<ApiResponse<BudgetResponse>>(`/api/events/${eventId}/budget/items`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create budget item failed');
  return data;
}

export async function submitEvent(eventId: number): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/submit`);
}

export async function openEvent(eventId: number): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/open`);
}

export async function startEvent(eventId: number): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/start`);
}

export async function completeEvent(eventId: number): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/complete`);
}

export async function archiveEvent(eventId: number): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/archive`);
}

// ── Edit / Delete APIs ────────────────────────────────────────────────────────

// CriteriaSet: PATCH updates name/description only; PUT .../criteria replaces criteria list
export interface PatchCriteriaSetRequest {
  name?: string;
  description?: string;
}

export interface ReplaceCriteriaRequest {
  criteria: {
    name: string;
    description?: string;
    maxScore: number;
    weight: number;
    displayOrder: number;
  }[];
}

export async function patchCriteriaSet(
  eventId: number,
  csId: number,
  req: PatchCriteriaSetRequest,
): Promise<CriteriaSet> {
  const res = await apiClient.patch<ApiResponse<CriteriaSet>>(
    `/api/events/${eventId}/criteria-sets/${csId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update criteria set failed');
  return data;
}

export async function replaceCriteria(
  eventId: number,
  csId: number,
  req: ReplaceCriteriaRequest,
): Promise<CriteriaSet> {
  const res = await apiClient.put<ApiResponse<CriteriaSet>>(
    `/api/events/${eventId}/criteria-sets/${csId}/criteria`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Replace criteria failed');
  return data;
}

export async function deleteCriteriaSet(eventId: number, csId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/criteria-sets/${csId}`);
}

// Round PATCH (does not change orderNumber)
export interface UpdateRoundRequest {
  name?: string;
  submissionDeadline?: string | null;
  scoringDeadline?: string | null;
  promotionTopN?: number | null;
  finalRound?: boolean;
  requiresRepo?: boolean;
  requiresDemo?: boolean;
  requiresSlide?: boolean;
  requiresReport?: boolean;
}

export async function updateRound(
  eventId: number,
  roundId: number,
  req: UpdateRoundRequest,
): Promise<EventRound> {
  const res = await apiClient.patch<ApiResponse<EventRound>>(
    `/api/events/${eventId}/rounds/${roundId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update round failed');
  return data;
}

export async function deleteRound(eventId: number, roundId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/rounds/${roundId}`);
}

// ─── Round lifecycle (FR-EVT-02 / BR-EVT-02) ────────────────────────────────
// DRAFT → OPEN_FOR_SUBMISSION → SUBMISSION_CLOSED → SCORING_OPEN → SCORING_LOCKED → COMPLETED
// Owner coordinator only. open-submission enforces BR-EVT-02 (previous round must be
// SCORING_LOCKED/COMPLETED) — surface the BE message to the user on 4xx.

async function transitionRound(
  eventId: number,
  roundId: number,
  action: string,
  body?: Record<string, unknown>,
): Promise<EventRound> {
  const res = await apiClient.post<ApiResponse<EventRound>>(
    `/api/events/${eventId}/rounds/${roundId}/${action}`,
    body,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? `Round ${action} failed`);
  return data;
}

export const openRoundSubmission = (eventId: number, roundId: number) =>
  transitionRound(eventId, roundId, 'open-submission');

export const closeRoundSubmission = (eventId: number, roundId: number) =>
  transitionRound(eventId, roundId, 'close-submission');

export const openRoundScoring = (eventId: number, roundId: number) =>
  transitionRound(eventId, roundId, 'open-scoring');

export const lockRoundScoring = (eventId: number, roundId: number) =>
  transitionRound(eventId, roundId, 'lock-scoring');

/** BR-SCR-05: unlocking is exceptional — reason is mandatory and audited. */
export const unlockRoundScoring = (eventId: number, roundId: number, reason: string) =>
  transitionRound(eventId, roundId, 'unlock-scoring', { reason });

export const completeRound = (eventId: number, roundId: number) =>
  transitionRound(eventId, roundId, 'complete');

// Category PATCH
export interface UpdateCategoryRequest {
  name?: string;
  description?: string | null;
  mentorId?: number | null;
  active?: boolean;
}

export async function updateCategory(
  eventId: number,
  categoryId: number,
  req: UpdateCategoryRequest,
): Promise<EventCategory> {
  const res = await apiClient.patch<ApiResponse<EventCategory>>(
    `/api/events/${eventId}/categories/${categoryId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update category failed');
  return data;
}

export async function deleteCategory(eventId: number, categoryId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/categories/${categoryId}`);
}

// Budget: GET returns full BudgetResponse with items embedded (no separate /items GET endpoint)
export interface BudgetItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount?: number | null;
  notes?: string | null;
  createdAt?: string;
}

export async function getBudget(eventId: number): Promise<BudgetResponse> {
  const res = await apiClient.get<ApiResponse<BudgetResponse>>(`/api/events/${eventId}/budget`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Failed to load budget');
  return data;
}

// PUT replaces item fully (all fields required); returns updated BudgetResponse
export interface UpdateBudgetItemRequest {
  categoryId: number;
  description: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export async function updateBudgetItem(
  eventId: number,
  itemId: number,
  req: UpdateBudgetItemRequest,
): Promise<BudgetResponse> {
  const res = await apiClient.put<ApiResponse<BudgetResponse>>(
    `/api/events/${eventId}/budget/items/${itemId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update budget item failed');
  return data;
}

// DELETE item returns updated BudgetResponse (not void)
export async function deleteBudgetItem(eventId: number, itemId: number): Promise<BudgetResponse> {
  const res = await apiClient.delete<ApiResponse<BudgetResponse>>(
    `/api/events/${eventId}/budget/items/${itemId}`,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Delete budget item failed');
  return data;
}

// PATCH budget header (currency / status)
export async function patchBudget(
  eventId: number,
  req: { currency?: string; status?: string },
): Promise<BudgetResponse> {
  const res = await apiClient.patch<ApiResponse<BudgetResponse>>(
    `/api/events/${eventId}/budget`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update budget failed');
  return data;
}

// ── Update event (name/description/registration window + capacity) ─────────────
export interface UpdateEventRequest {
  name?: string;
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
  maxTeamSize?: number | null;
  maxTeams?: number | null;
  maxParticipants?: number | null;
  maxTeamsPerMentor?: number | null;
}

export async function updateEvent(eventId: number, req: UpdateEventRequest): Promise<EventSummary> {
  const res = await apiClient.patch<ApiResponse<EventSummary>>(`/api/events/${eventId}`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update event failed');
  return data;
}

// ── Super Coordinator: approve / reject event ─────────────────────────────────
export async function approveEvent(eventId: number): Promise<EventSummary> {
  const res = await apiClient.post<ApiResponse<EventSummary>>(`/api/events/${eventId}/approve`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Approve event failed');
  return data;
}

export async function rejectEvent(eventId: number, reason: string): Promise<EventSummary> {
  const res = await apiClient.post<ApiResponse<EventSummary>>(`/api/events/${eventId}/reject`, { reason });
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Reject event failed');
  return data;
}

// ── Mentor planning (capacity 3-tier) ─────────────────────────────────────────
export interface MentorPlanning {
  eventId: number;
  activeTeams: number;
  maxTeamsPerMentor: number;
  mentorsNeeded: number;
  currentMentors: number;
  gap: number;
}

export async function getMentorPlanning(eventId: number): Promise<MentorPlanning> {
  const res = await apiClient.get<ApiResponse<MentorPlanning>>(`/api/events/${eventId}/mentor-planning`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Failed to load mentor planning');
  return data;
}

// ── Category resources (dataset/docs per category) ────────────────────────────
export type ResourceType = 'DATASET' | 'DOC' | 'SAMPLE' | 'LINK' | 'OTHER';

export interface CategoryResource {
  id: number;
  categoryId: number;
  label?: string | null;
  url: string;
  resourceType: ResourceType;
  createdAt?: string;
}

export interface CreateCategoryResourceRequest {
  label?: string;
  url: string;
  resourceType: ResourceType;
}

export async function getCategoryResources(eventId: number, categoryId: number): Promise<CategoryResource[]> {
  const res = await apiClient.get<ApiResponse<CategoryResource[]>>(
    `/api/events/${eventId}/categories/${categoryId}/resources`,
  );
  return res.data.data ?? [];
}

export async function createCategoryResource(
  eventId: number,
  categoryId: number,
  req: CreateCategoryResourceRequest,
): Promise<CategoryResource> {
  const res = await apiClient.post<ApiResponse<CategoryResource>>(
    `/api/events/${eventId}/categories/${categoryId}/resources`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create resource failed');
  return data;
}

export async function deleteCategoryResource(
  eventId: number,
  categoryId: number,
  resourceId: number,
): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/categories/${categoryId}/resources/${resourceId}`);
}


