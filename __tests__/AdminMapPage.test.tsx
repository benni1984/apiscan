import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminMapPage from '@/app/[locale]/dashboard/admin/map/page';

const mockAdminGetApiaries = vi.hoisted(() => vi.fn());
const mockAdminGetFlaggedApiaries = vi.hoisted(() => vi.fn());
const mockAdminSetPrivate = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardAuth', () => ({ useDashboardAuth: mockUseDashboardAuth }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock('@/lib/api', () => ({
  adminGetApiaries: mockAdminGetApiaries,
  adminGetFlaggedApiaries: mockAdminGetFlaggedApiaries,
  adminSetPrivate: mockAdminSetPrivate,
  logout: vi.fn(),
}));

const mockAdmin = { id: 'a1', email: 'admin@example.com', name: 'Admin', locale: 'en', created_at: '2024-01-01', is_admin: true, is_supporter: false };

const mockApiaryPage = {
  items: [
    { id: 'ap1', name: 'Sunny Apiary', owner_email: 'owner@example.com', hive_count: 5, is_public: true, latitude: 48.1, longitude: 11.6, created_at: '2024-01-01' },
  ],
  total: 1, page: 1, per_page: 20, pages: 1,
};

describe('AdminMapPage', () => {
  beforeEach(() => {
    mockUseDashboardAuth.mockReturnValue({ user: mockAdmin, loading: false });
    mockAdminGetApiaries.mockResolvedValue(mockApiaryPage);
    mockAdminGetFlaggedApiaries.mockResolvedValue([]);
    mockAdminSetPrivate.mockResolvedValue({});
  });

  it('renders map moderation title', async () => {
    render(<AdminMapPage />);
    await waitFor(() => expect(screen.getByText('admin.map.title')).toBeInTheDocument());
  });

  it('lists public apiaries in the table', async () => {
    render(<AdminMapPage />);
    await waitFor(() => expect(screen.getByText('Sunny Apiary')).toBeInTheDocument());
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
  });

  it('shows flagged tab and switches to it', async () => {
    render(<AdminMapPage />);
    await waitFor(() => screen.getByText('admin.map.flagged'));
    fireEvent.click(screen.getByText('admin.map.flagged'));
    await waitFor(() => expect(mockAdminGetFlaggedApiaries).toHaveBeenCalled());
  });

  it('shows empty state when no flagged apiaries', async () => {
    render(<AdminMapPage />);
    await waitFor(() => screen.getByText('admin.map.flagged'));
    fireEvent.click(screen.getByText('admin.map.flagged'));
    await waitFor(() => expect(screen.getByText('admin.map.noFlagged')).toBeInTheDocument());
  });

  it('calls adminSetPrivate on set-private button click', async () => {
    render(<AdminMapPage />);
    await waitFor(() => screen.getByText('admin.map.setPrivate'));
    fireEvent.click(screen.getByText('admin.map.setPrivate'));
    await waitFor(() => expect(mockAdminSetPrivate).toHaveBeenCalledWith('ap1'));
  });
});
