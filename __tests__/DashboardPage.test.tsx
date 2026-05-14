import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardPage from '@/app/[locale]/dashboard/page';

const mockGetApiaries = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getApiaries: mockGetApiaries,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 100 });

describe('DashboardPage', () => {
  beforeEach(() => {
    mockGetApiaries.mockClear();
  });

  it('shows empty state when user has no apiaries', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([]));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('apiaries.empty')).toBeInTheDocument());
  });

  it('renders a card for each apiary', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([
      { id: 'a-1', name: 'North Apiary', hive_count: 5, is_public: true },
      { id: 'a-2', name: 'South Apiary', hive_count: 2, is_public: false },
    ]));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('North Apiary')).toBeInTheDocument());
    expect(screen.getByText('South Apiary')).toBeInTheDocument();
  });

  it('each apiary card links to its detail page', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([
      { id: 'a-42', name: 'My Apiary', hive_count: 3, is_public: false },
    ]));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    expect(screen.getByRole('link', { name: /My Apiary/i })).toHaveAttribute('href', '/dashboard/apiary/a-42');
  });

  it('shows public/private badge on each card', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([
      { id: 'a-1', name: 'Public One', hive_count: 1, is_public: true },
      { id: 'a-2', name: 'Private One', hive_count: 1, is_public: false },
    ]));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('Public One'));
    expect(screen.getByText('apiaries.public')).toBeInTheDocument();
    expect(screen.getByText('apiaries.private')).toBeInTheDocument();
  });
});
