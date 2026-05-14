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

// ── Types ──────────────────────────────────────────────────────────────────────
export interface User { id: string; email: string; name: string; locale: string; created_at: string; }
export interface Apiary { id: string; name: string; hive_count: number; is_public: boolean; description?: string; }
export interface Hive { id: string; name: string; hive_type: string; apiary_id: string; last_inspection_at?: string; }
export interface Inspection {
  id: string; date: string; varroa_count?: number; mood?: string;
  queen_seen?: boolean; brood_frames?: number; honey_frames?: number;
}
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
export interface Paginated<T> { items: T[]; total: number; page: number; per_page: number; }
