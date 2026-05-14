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

const mockUser = { id: '1', email: 'admin@example.com', name: 'Admin User', locale: 'en', created_at: '2024-01-01' };

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
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
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
});
