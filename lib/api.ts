const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch { return false; }
}

async function apiFetch(
  path: string,
  init: { method?: string; body?: string; headers?: Record<string, string> } = {},
  retry = true,
): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, init, false);
    clearTokens();
    throw new Error('unauthorized');
  }
  return res;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Login failed');
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Registration failed');
  }
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.user;
}

export async function logout() {
  const rt = getRefreshToken();
  if (rt) {
    try { await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: rt }) }); } catch {}
  }
  clearTokens();
}

export async function getMe(): Promise<User> {
  const res = await apiFetch('/users/me');
  if (!res.ok) throw new Error('Failed to get user');
  return res.json();
}

export async function deleteMe(): Promise<void> {
  const res = await apiFetch('/users/me', { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  clearTokens();
}

export async function updateMe(data: { name?: string; locale?: string; password?: string; current_password?: string }): Promise<User> {
  const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function getApiaries(): Promise<Paginated<Apiary>> {
  const res = await apiFetch('/apiaries?per_page=100');
  if (!res.ok) throw new Error('Failed to get apiaries');
  return res.json();
}

export async function getApiary(id: string): Promise<Apiary> {
  const res = await apiFetch(`/apiaries/${id}`);
  if (!res.ok) throw new Error('Failed to get apiary');
  return res.json();
}

export async function createApiary(data: { name: string; description?: string; address?: string; is_public: boolean }): Promise<Apiary> {
  const res = await apiFetch('/apiaries', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function updateApiary(id: string, data: { name?: string; description?: string; address?: string; is_public?: boolean }): Promise<Apiary> {
  const res = await apiFetch(`/apiaries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function deleteApiary(id: string): Promise<void> {
  const res = await apiFetch(`/apiaries/${id}`, { method: 'DELETE' });
  if (res.status === 409) throw new Error('has_hives');
  if (!res.ok) throw new Error('Delete failed');
}

export async function createHive(apiaryId: string, data: { name: string; hive_type: string; acquisition_date?: string; notes?: string }): Promise<Hive> {
  const res = await apiFetch(`/apiaries/${apiaryId}/hives`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function updateHive(id: string, data: { name?: string; hive_type?: string; acquisition_date?: string; notes?: string }): Promise<Hive> {
  const res = await apiFetch(`/hives/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function deleteHive(id: string): Promise<void> {
  const res = await apiFetch(`/hives/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getHives(apiaryId: string): Promise<Paginated<Hive>> {
  const res = await apiFetch(`/apiaries/${apiaryId}/hives?per_page=100`);
  if (!res.ok) throw new Error('Failed to get hives');
  return res.json();
}

export async function getHive(id: string): Promise<Hive> {
  const res = await apiFetch(`/hives/${id}`);
  if (!res.ok) throw new Error('Failed to get hive');
  return res.json();
}

export async function getHiveStats(id: string): Promise<HiveStats> {
  const res = await apiFetch(`/hives/${id}/stats?preset=365d`);
  if (!res.ok) throw new Error('Failed to get hive stats');
  return res.json();
}

export async function getApiaryStats(id: string): Promise<ApiaryStats> {
  const res = await apiFetch(`/apiaries/${id}/stats?preset=365d`);
  if (!res.ok) throw new Error('Failed to get apiary stats');
  return res.json();
}

export async function getInspections(hiveId: string): Promise<Paginated<Inspection>> {
  const res = await apiFetch(`/hives/${hiveId}/inspections?per_page=50`);
  if (!res.ok) throw new Error('Failed to get inspections');
  return res.json();
}

export async function createInspection(hiveId: string, data: InspectionInput): Promise<Inspection> {
  const res = await apiFetch(`/hives/${hiveId}/inspections`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function updateInspection(id: string, data: InspectionInput): Promise<Inspection> {
  const res = await apiFetch(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function deleteInspection(id: string): Promise<void> {
  const res = await apiFetch(`/inspections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getQrBatches(page = 1): Promise<Paginated<QrBatchSummary>> {
  const res = await apiFetch(`/qr-batches?page=${page}&per_page=20`);
  if (!res.ok) throw new Error('Failed to get QR batches');
  return res.json();
}

export async function createQrBatch(count: number): Promise<QrBatchOut> {
  const res = await apiFetch('/qr-batches', { method: 'POST', body: JSON.stringify({ count }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function getQrBatch(id: string): Promise<QrBatchOut> {
  const res = await apiFetch(`/qr-batches/${id}`);
  if (!res.ok) throw new Error('Failed to get QR batch');
  return res.json();
}

export async function downloadQrBatchPdf(id: string): Promise<Blob> {
  const res = await apiFetch(`/qr-batches/${id}/pdf`);
  if (!res.ok) throw new Error('Failed to download PDF');
  return res.blob();
}

export async function getUserFieldDefs(): Promise<FieldDefinition[]> {
  const res = await apiFetch('/field-definitions');
  if (!res.ok) throw new Error('Failed to get field definitions');
  return res.json();
}

export async function createUserFieldDef(data: FieldDefinitionCreate): Promise<FieldDefinition> {
  const res = await apiFetch('/field-definitions', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function updateUserFieldDef(id: string, data: FieldDefinitionUpdate): Promise<FieldDefinition> {
  const res = await apiFetch(`/field-definitions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function deleteUserFieldDef(id: string): Promise<void> {
  const res = await apiFetch(`/field-definitions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function getApiaryFieldDefs(apiaryId: string): Promise<FieldDefinition[]> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions`);
  if (!res.ok) throw new Error('Failed to get field definitions');
  return res.json();
}

export async function createApiaryFieldDef(apiaryId: string, data: FieldDefinitionCreate): Promise<FieldDefinition> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions`, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Create failed');
  }
  return res.json();
}

export async function updateApiaryFieldDef(apiaryId: string, fid: string, data: FieldDefinitionUpdate): Promise<FieldDefinition> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions/${fid}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Update failed');
  }
  return res.json();
}

export async function deleteApiaryFieldDef(apiaryId: string, fid: string): Promise<void> {
  const res = await apiFetch(`/apiaries/${apiaryId}/field-definitions/${fid}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface User { id: string; email: string; name: string; locale: string; created_at: string; is_admin: boolean; is_supporter: boolean; }
export interface Apiary { id: string; name: string; hive_count: number; is_public: boolean; description?: string; address?: string; latitude?: number; longitude?: number; created_at: string; }
export interface Hive { id: string; name: string; hive_type: string; apiary_id: string; last_inspection_at?: string; notes?: string; acquisition_date?: string; }
export interface Inspection {
  id: string; date: string; varroa_count?: number; mood?: string;
  queen_seen?: boolean; brood_frames?: number; honey_frames?: number;
  custom_fields?: Record<string, unknown>;
}
export interface InspectionInput {
  date: string;
  varroa_count?: number | null;
  mood?: string | null;
  queen_seen?: boolean | null;
  brood_frames?: number | null;
  custom_fields?: Record<string, unknown>;
}
export interface QrToken { token: string; linked_hive_id: string | null; }
export interface QrBatchSummary { id: string; count: number; created_at: string; linked_count: number; }
export interface QrBatchOut { id: string; count: number; created_at: string; tokens: QrToken[]; }
export interface HiveStats {
  inspection_count: number;
  varroa_trend: { date: string; value: number }[];
  mood_distribution: { calm: number; nervous: number; aggressive: number };
}
export interface ApiaryStats {
  hive_count: number;
  inspections_total: number;
  average_varroa?: number;
  mood_distribution: { calm: number; nervous: number; aggressive: number };
}
export interface Paginated<T> { items: T[]; total: number; page: number; per_page: number; pages: number; }

// ── Field Definition types ─────────────────────────────────────────────────────
export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'select';
export type FieldTarget = 'hive' | 'inspection';
export type FieldScope = 'user' | 'apiary';
export interface FieldDefinition {
  id: string; scope: FieldScope; apiary_id: string | null;
  target: FieldTarget; name: string; type: FieldType;
  options: string[]; required: boolean;
  default_value: string | number | boolean | null; sort_order: number;
}
export interface FieldDefinitionCreate {
  target: FieldTarget; name: string; type: FieldType;
  options?: string[]; required?: boolean;
  default_value?: string | number | boolean | null; sort_order?: number;
}
export interface FieldDefinitionUpdate {
  name?: string; options?: string[]; required?: boolean;
  default_value?: string | number | boolean | null; sort_order?: number;
}

// ── Admin types ────────────────────────────────────────────────────────────────
export interface AdminUser { id: string; email: string; name: string; locale: string; is_admin: boolean; is_supporter: boolean; created_at: string; }
export interface AdminApiary { id: string; name: string; owner_email: string; latitude?: number; longitude?: number; hive_count: number; is_public: boolean; created_at: string; }
export interface PlatformStats { preset: string; total_users: number; new_users_in_period: number; supporter_count: number; total_apiaries: number; public_apiaries: number; total_hives: number; total_inspections: number; active_users_30d: number; signups_by_day: { date: string; count: number }[]; }
export interface HealthSummary { inactive_users: number; zero_inspection_hives: number; no_varroa_inspections: number; }
export interface InactiveUser { id: string; email: string; name: string; created_at: string; apiary_count: number; }
export interface NoVarroaApiary { apiary_id: string; apiary_name: string; owner_email: string; missing_varroa_count: number; }
export interface ZeroInspectionHive { id: string; name: string; hive_type: string; apiary_id: string; apiary_name: string; owner_email: string; initialized_at: string; }
export interface TokenStats { total_active_sessions: number; users_with_active_sessions: number; avg_sessions_per_user: number; }

// ── Admin API ──────────────────────────────────────────────────────────────────
export async function adminGetStats(preset = '30d'): Promise<PlatformStats> {
  const res = await apiFetch(`/admin/stats?preset=${preset}`);
  if (!res.ok) throw new Error('Failed to get stats');
  return res.json();
}

export async function adminGetUsers(params: { q?: string; supporter?: boolean; page?: number; per_page?: number } = {}): Promise<Paginated<AdminUser>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.supporter !== undefined) qs.set('supporter', String(params.supporter));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/users?${qs}`);
  if (!res.ok) throw new Error('Failed to get users');
  return res.json();
}

export async function adminSetSupporter(userId: string, isSupporter: boolean): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${userId}/supporter`, { method: 'PUT', body: JSON.stringify({ is_supporter: isSupporter }) });
  if (!res.ok) throw new Error('Failed to update supporter status');
  return res.json();
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function adminRevokeTokens(userId: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}/tokens`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke tokens');
}

export async function adminGetApiaries(params: { page?: number; per_page?: number } = {}): Promise<Paginated<AdminApiary>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/apiaries?${qs}`);
  if (!res.ok) throw new Error('Failed to get apiaries');
  return res.json();
}

export async function adminGetFlaggedApiaries(): Promise<AdminApiary[]> {
  const res = await apiFetch('/admin/apiaries/flagged');
  if (!res.ok) throw new Error('Failed to get flagged apiaries');
  return res.json();
}

export async function adminSetPrivate(apiaryId: string): Promise<AdminApiary> {
  const res = await apiFetch(`/admin/apiaries/${apiaryId}/set-private`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to set apiary private');
  return res.json();
}

export async function adminGetHealthSummary(): Promise<HealthSummary> {
  const res = await apiFetch('/admin/health/summary');
  if (!res.ok) throw new Error('Failed to get health summary');
  return res.json();
}

export async function adminGetInactiveUsers(params: { page?: number; per_page?: number } = {}): Promise<Paginated<InactiveUser>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await apiFetch(`/admin/health/inactive-users?${qs}`);
  if (!res.ok) throw new Error('Failed to get inactive users');
  return res.json();
}

export async function adminGetNoVarroaApiaries(): Promise<NoVarroaApiary[]> {
  const res = await apiFetch('/admin/health/no-varroa-inspections');
  if (!res.ok) throw new Error('Failed to get no-varroa apiaries');
  return res.json();
}

export async function adminGetZeroInspectionHives(): Promise<ZeroInspectionHive[]> {
  const res = await apiFetch('/admin/health/zero-inspection-hives');
  if (!res.ok) throw new Error('Failed to get zero-inspection hives');
  return res.json();
}

export async function adminGetTokenStats(): Promise<TokenStats> {
  const res = await apiFetch('/admin/tokens/stats');
  if (!res.ok) throw new Error('Failed to get token stats');
  return res.json();
}
