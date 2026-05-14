import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, logout, getMe, getApiaries, getHive, clearTokens } from '@/lib/api';

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01' };
const mockTokens = { access_token: 'access-123', refresh_token: 'refresh-456', user: mockUser };

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('login', () => {
  it('stores tokens and returns user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    const user = await login('a@b.com', 'pass');
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('access-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-456');
  });

  it('throws with server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Invalid credentials' }, 401));
    await expect(login('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

describe('register', () => {
  it('stores tokens and returns user on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockTokens));
    const user = await register('Test', 'a@b.com', 'password123');
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('access-123');
  });

  it('throws with server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Email already registered' }, 422));
    await expect(register('Test', 'a@b.com', 'pass')).rejects.toThrow('Email already registered');
  });
});

describe('logout', () => {
  it('clears both tokens after server call', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}));
    await logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('still clears tokens when server call throws', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network'));
    await logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('clearTokens', () => {
  it('removes both localStorage keys', () => {
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'r');
    clearTokens();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('getMe', () => {
  it('sends Authorization header and returns user', async () => {
    localStorage.setItem('access_token', 'my-token');
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockUser));
    const user = await getMe();
    expect(user).toEqual(mockUser);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer my-token' });
  });

  it('refreshes token on 401 then retries successfully', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({}, 401))               // /users/me → 401
      .mockResolvedValueOnce(ok({ access_token: 'new' })) // /auth/refresh → ok
      .mockResolvedValueOnce(ok(mockUser));              // /users/me retry → ok
    const user = await getMe();
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('new');
  });

  it('throws "unauthorized" and clears tokens when refresh also fails', async () => {
    localStorage.setItem('access_token', 'expired');
    localStorage.setItem('refresh_token', 'bad');
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({}, 401))  // /users/me → 401
      .mockResolvedValueOnce(ok({}, 401)); // /auth/refresh → 401 (fails)
    await expect(getMe()).rejects.toThrow('unauthorized');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('getApiaries', () => {
  it('requests /apiaries?per_page=100 with auth header', async () => {
    localStorage.setItem('access_token', 'tok');
    const data = { items: [], total: 0, page: 1, per_page: 100 };
    vi.mocked(fetch).mockResolvedValueOnce(ok(data));
    const result = await getApiaries();
    expect(result).toEqual(data);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/apiaries?per_page=100');
  });
});

describe('getHive', () => {
  it('requests /hives/{id}', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'Hive 1', hive_type: 'langstroth', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive));
    const result = await getHive('h-1');
    expect(result).toEqual(hive);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/hives/h-1');
  });
});
