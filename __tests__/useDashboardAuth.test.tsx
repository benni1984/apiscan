import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

// Stable object — same reference across re-renders so [router] dependency doesn't retrigger the effect
const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));
const mockGetMe = vi.hoisted(() => vi.fn());
const mockClearTokens = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/lib/api', () => ({
  getMe: mockGetMe,
  clearTokens: mockClearTokens,
}));

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01' };

describe('useDashboardAuth', () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockGetMe.mockClear();
    mockClearTokens.mockClear();
    localStorage.clear();
  });

  it('redirects to /dashboard/login immediately when no token in storage', () => {
    renderHook(() => useDashboardAuth());
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/login');
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it('sets user and clears loading state when getMe resolves', async () => {
    localStorage.setItem('access_token', 'tok');
    mockGetMe.mockResolvedValueOnce(mockUser);
    const { result } = renderHook(() => useDashboardAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockUser);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('clears tokens and redirects when getMe throws', async () => {
    localStorage.setItem('access_token', 'expired');
    mockGetMe.mockRejectedValueOnce(new Error('unauthorized'));
    renderHook(() => useDashboardAuth());
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/login'));
    expect(mockClearTokens).toHaveBeenCalled();
  });
});
