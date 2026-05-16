import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, logout, getMe, updateMe, deleteMe, getApiaries, createApiary, updateApiary, deleteApiary, createHive, updateHive, deleteHive, getHive, clearTokens } from '@/lib/api';

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

describe('updateMe', () => {
  it('sends PUT /users/me with body and returns updated user', async () => {
    localStorage.setItem('access_token', 'tok');
    const updated = { ...mockUser, name: 'New Name' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(updated));
    const result = await updateMe({ name: 'New Name' });
    expect(result).toEqual(updated);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/users/me');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Current password is incorrect' }, 400));
    await expect(updateMe({ password: 'new', current_password: 'wrong' })).rejects.toThrow('Current password is incorrect');
  });
});

describe('deleteMe', () => {
  it('sends DELETE /users/me and clears tokens on success', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteMe();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/users/me');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteMe()).rejects.toThrow('Delete failed');
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

describe('createApiary', () => {
  it('sends POST /apiaries with body and returns new apiary', async () => {
    localStorage.setItem('access_token', 'tok');
    const apiary = { id: 'a-1', name: 'New Apiary', hive_count: 0, is_public: false, created_at: '2025-01-01T00:00:00Z' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(apiary, 201));
    const result = await createApiary({ name: 'New Apiary', is_public: false });
    expect(result).toEqual(apiary);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(String(call[0])).toContain('/apiaries');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ name: 'New Apiary', is_public: false });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Validation error' }, 422));
    await expect(createApiary({ name: '', is_public: false })).rejects.toThrow('Validation error');
  });
});

describe('updateApiary', () => {
  it('sends PUT /apiaries/{id} with body and returns updated apiary', async () => {
    localStorage.setItem('access_token', 'tok');
    const apiary = { id: 'a-1', name: 'Renamed', hive_count: 2, is_public: true, created_at: '2025-01-01T00:00:00Z' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(apiary));
    const result = await updateApiary('a-1', { name: 'Renamed', is_public: true });
    expect(result).toEqual(apiary);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/apiaries/a-1');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Not found' }, 404));
    await expect(updateApiary('bad-id', { name: 'X' })).rejects.toThrow('Not found');
  });
});

describe('deleteApiary', () => {
  it('sends DELETE /apiaries/{id} and resolves on 204', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteApiary('a-1')).resolves.toBeUndefined();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/apiaries/a-1');
  });

  it('throws "has_hives" on 409', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 409 }));
    await expect(deleteApiary('a-1')).rejects.toThrow('has_hives');
  });

  it('throws on other server errors', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteApiary('a-1')).rejects.toThrow('Delete failed');
  });
});

describe('createHive', () => {
  it('sends POST /apiaries/{id}/hives with body and returns new hive', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'New Hive', hive_type: 'langstroth', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive, 201));
    const result = await createHive('a-1', { name: 'New Hive', hive_type: 'langstroth' });
    expect(result).toEqual(hive);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('POST');
    expect(String(call[0])).toContain('/apiaries/a-1/hives');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toMatchObject({ name: 'New Hive', hive_type: 'langstroth' });
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'APIARY_NOT_FOUND' }, 404));
    await expect(createHive('bad', { name: 'X', hive_type: 'langstroth' })).rejects.toThrow('APIARY_NOT_FOUND');
  });
});

describe('updateHive', () => {
  it('sends PUT /hives/{id} with body and returns updated hive', async () => {
    localStorage.setItem('access_token', 'tok');
    const hive = { id: 'h-1', name: 'Renamed', hive_type: 'dadant', apiary_id: 'a-1' };
    vi.mocked(fetch).mockResolvedValueOnce(ok(hive));
    const result = await updateHive('h-1', { name: 'Renamed', hive_type: 'dadant' });
    expect(result).toEqual(hive);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call[1] as RequestInit).method).toBe('PUT');
    expect(String(call[0])).toContain('/hives/h-1');
  });

  it('throws with server message on failure', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({ detail: 'Not found' }, 404));
    await expect(updateHive('bad-id', { name: 'X' })).rejects.toThrow('Not found');
  });
});

describe('deleteHive', () => {
  it('sends DELETE /hives/{id} and resolves on 204', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteHive('h-1')).resolves.toBeUndefined();
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/hives/h-1');
  });

  it('throws on server error', async () => {
    localStorage.setItem('access_token', 'tok');
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(deleteHive('h-1')).rejects.toThrow('Delete failed');
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
