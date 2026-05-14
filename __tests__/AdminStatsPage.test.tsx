import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminStatsPage from '@/app/[locale]/dashboard/admin/page';

const mockAdminGetStats = vi.hoisted(() => vi.fn());
const mockAdminGetTokenStats = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({ useDashboardAuth: mockUseDashboardAuth }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('@/lib/api', () => ({
  adminGetStats: mockAdminGetStats,
  adminGetTokenStats: mockAdminGetTokenStats,
  logout: vi.fn(),
}));

const mockAdmin = { id: '1', email: 'admin@example.com', name: 'Admin', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };

const mockStats = {
  preset: '30d', total_users: 100, new_users_in_period: 10, supporter_count: 5,
  total_apiaries: 50, public_apiaries: 20, total_hives: 200, total_inspections: 500,
  active_users_30d: 30, signups_by_day: [{ date: '2024-05-01', count: 3 }],
};
const mockTokens = { total_active_sessions: 42, users_with_active_sessions: 25, avg_sessions_per_user: 1.68 };

describe('AdminStatsPage', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetStats.mockResolvedValue(mockStats);
    mockAdminGetTokenStats.mockResolvedValue(mockTokens);
  });

  it('renders platform stats title', async () => {
    render(<AdminStatsPage />);
    await waitFor(() => expect(screen.getByText('admin.stats.title')).toBeInTheDocument());
  });

  it('displays stat pills with correct values', async () => {
    render(<AdminStatsPage />);
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays signups-by-day bar chart entries', async () => {
    render(<AdminStatsPage />);
    await waitFor(() => expect(screen.getByText('2024-05-01')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('changes preset on button click and reloads', async () => {
    render(<AdminStatsPage />);
    await waitFor(() => screen.getByText('90d'));
    fireEvent.click(screen.getByText('90d'));
    await waitFor(() => expect(mockAdminGetStats).toHaveBeenCalledWith('90d'));
  });

  it('shows navigation links to sub-pages', async () => {
    render(<AdminStatsPage />);
    await waitFor(() => expect(screen.getAllByText('admin.nav.users').length).toBeGreaterThan(0));
    expect(screen.getAllByText('admin.nav.map').length).toBeGreaterThan(0);
    expect(screen.getAllByText('admin.nav.health').length).toBeGreaterThan(0);
  });
});
