import { apiClient } from './client';
import type { ApiResponse } from './types';

export type EventType = 'SPRING' | 'SUMMER' | 'FALL';

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
  name: string;
  orderNumber: number;
  status: string;
  submissionDeadline?: string | null;
  promotionTopN?: number | null;
}

export interface EventCategory {
  id: number;
  name: string;
  description?: string | null;
  maxTeams?: number | null;
}

export interface CriterionItem {
  id: number;
  name: string;
  maxScore: number;
  weight: number;
  description?: string | null;
  orderIndex?: number | null;
}

export interface CriteriaSet {
  id: number;
  name: string;
  description?: string | null;
  criteria?: CriterionItem[];
}

export async function getEvents(): Promise<EventSummary[]> {
  const res = await apiClient.get<ApiResponse<EventSummary[]>>('/api/events');
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
  promotionTopN?: number;
  isFinalRound: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateCriteriaSetRequest {
  name: string;
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
  currency: string;
}

export interface CreateBudgetItemRequest {
  categoryId: number;
  description: string;
  quantity: number;
  unitCost: number;
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

export async function createBudgetItem(eventId: number, req: CreateBudgetItemRequest): Promise<void> {
  await apiClient.post(`/api/events/${eventId}/budget/items`, req);
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

export interface UpdateCriteriaSetRequest {
  name: string;
  criteria: {
    name: string;
    description?: string;
    maxScore: number;
    weight: number;
    displayOrder: number;
  }[];
}

export async function updateCriteriaSet(
  eventId: number,
  csId: number,
  req: UpdateCriteriaSetRequest,
): Promise<CriteriaSet> {
  const res = await apiClient.put<ApiResponse<CriteriaSet>>(
    `/api/events/${eventId}/criteria-sets/${csId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update criteria set failed');
  return data;
}

export async function deleteCriteriaSet(eventId: number, csId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/criteria-sets/${csId}`);
}

export async function deleteRound(eventId: number, roundId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/rounds/${roundId}`);
}

export async function deleteCategory(eventId: number, categoryId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/categories/${categoryId}`);
}

export interface BudgetItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  description: string;
  quantity: number;
  unitCost: number;
}

export async function getBudgetItems(eventId: number): Promise<BudgetItem[]> {
  const res = await apiClient.get<ApiResponse<BudgetItem[]>>(`/api/events/${eventId}/budget/items`);
  return res.data.data ?? [];
}

export async function patchBudgetItem(
  eventId: number,
  itemId: number,
  req: { description?: string; quantity?: number; unitCost?: number },
): Promise<BudgetItem> {
  const res = await apiClient.patch<ApiResponse<BudgetItem>>(
    `/api/events/${eventId}/budget/items/${itemId}`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update budget item failed');
  return data;
}

export async function deleteBudgetItem(eventId: number, itemId: number): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/budget/items/${itemId}`);
}
