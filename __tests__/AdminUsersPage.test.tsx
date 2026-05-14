import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminUsersPage from '@/app/[locale]/dashboard/admin/users/page';

const mockAdminGetUsers = vi.hoisted(() => vi.fn());
const mockAdminSetSupporter = vi.hoisted(() => vi.fn());
const mockAdminDeleteUser = vi.hoisted(() => vi.fn());
const mockAdminRevokeTokens = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({ useDashboardAuth: mockUseDashboardAuth }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('@/lib/api', () => ({
  adminGetUsers: mockAdminGetUsers,
  adminSetSupporter: mockAdminSetSupporter,
  adminDeleteUser: mockAdminDeleteUser,
  adminRevokeTokens: mockAdminRevokeTokens,
  logout: vi.fn(),
}));

const mockAdmin = { id: 'a1', email: 'admin@example.com', name: 'Admin', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };

const mockUsersPage = {
  items: [
    { id: 'u1', email: 'alice@example.com', name: 'Alice', locale: 'en', is_admin: false, is_supporter: true, created_at: '2024-03-01' },
    { id: 'u2', email: 'bob@example.com', name: 'Bob', locale: 'en', is_admin: false, is_supporter: false, created_at: '2024-04-01' },
  ],
  total: 2, page: 1, per_page: 20, pages: 1,
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetUsers.mockResolvedValue(mockUsersPage);
    mockAdminSetSupporter.mockResolvedValue({});
    mockAdminDeleteUser.mockResolvedValue(undefined);
    mockAdminRevokeTokens.mockResolvedValue(undefined);
    vi.stubGlobal('confirm', () => true);
  });

  it('renders user management title', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByText('admin.users.title')).toBeInTheDocument());
  });

  it('lists users in the table', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByText('alice@example.com')).toBeInTheDocument());
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByPlaceholderText('admin.users.search')).toBeInTheDocument());
  });

  it('calls adminGetUsers with query on search input change', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => screen.getByPlaceholderText('admin.users.search'));
    fireEvent.change(screen.getByPlaceholderText('admin.users.search'), { target: { value: 'alice' } });
    await waitFor(() => expect(mockAdminGetUsers).toHaveBeenCalledWith(expect.objectContaining({ q: 'alice' })));
  });

  it('calls adminDeleteUser on delete click', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => screen.getAllByText('admin.users.delete'));
    fireEvent.click(screen.getAllByText('admin.users.delete')[0]);
    await waitFor(() => expect(mockAdminDeleteUser).toHaveBeenCalledWith('u1'));
  });
});
