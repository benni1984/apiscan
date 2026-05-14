import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardShell from '@/components/DashboardShell';

const mockReplace = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  logout: mockLogout,
}));

const mockUser = { id: '1', email: 'user@example.com', name: 'Regular User', locale: 'en', created_at: '2024-01-01', is_admin: false, is_supporter: false };
const mockAdmin = { id: '2', email: 'admin@example.com', name: 'Admin User', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };

describe('DashboardShell', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogout.mockClear();
  });

  it('shows spinner while loading', () => {
    mockUseDashboardAuth.mockReturnValue({ user: null, loading: true });
    const { container } = render(<DashboardShell>content</DashboardShell>);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows user name and email in sidebar when loaded', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders children inside main area', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell><p>page content</p></DashboardShell>);
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('calls logout and redirects to login on logout button click', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    mockLogout.mockResolvedValueOnce(undefined);
    render(<DashboardShell>content</DashboardShell>);
    fireEvent.click(screen.getByText('nav.logout'));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard/login'));
  });

  it('shows admin nav links for admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.getByText('admin.nav.stats')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.users')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.map')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.health')).toBeInTheDocument();
  });

  it('hides admin nav links for non-admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell>content</DashboardShell>);
    expect(screen.queryByText('admin.nav.stats')).not.toBeInTheDocument();
    expect(screen.queryByText('admin.nav.users')).not.toBeInTheDocument();
  });

  it('redirects non-admin away from adminOnly pages', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<DashboardShell adminOnly>content</DashboardShell>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders adminOnly page for admin users', () => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    render(<DashboardShell adminOnly>admin content</DashboardShell>);
    expect(screen.getByText('admin content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
