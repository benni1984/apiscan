import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ApiaryPage from '@/app/[locale]/dashboard/apiary/[id]/page';

const mockGetApiary = vi.hoisted(() => vi.fn());
const mockGetHives = vi.hoisted(() => vi.fn());
const mockGetApiaryStats = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'apiary-1' }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getApiary: mockGetApiary,
  getHives: mockGetHives,
  getApiaryStats: mockGetApiaryStats,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 100 });

describe('ApiaryPage', () => {
  beforeEach(() => {
    mockGetApiary.mockClear();
    mockGetHives.mockClear();
    mockGetApiaryStats.mockClear();
  });

  function setupMocks({
    apiary = { id: 'apiary-1', name: 'My Apiary', hive_count: 3, is_public: false },
    hives = [] as { id: string; name: string; hive_type: string; apiary_id: string }[],
    stats = { hive_count: 3, inspections_total: 12, average_varroa: 2.5, mood_distribution: {} },
  } = {}) {
    mockGetApiary.mockResolvedValueOnce(apiary);
    mockGetHives.mockResolvedValueOnce(paginated(hives));
    mockGetApiaryStats.mockResolvedValueOnce(stats);
  }

  it('shows apiary name after data loads', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => expect(screen.getByText('My Apiary')).toBeInTheDocument());
  });

  it('shows hive count, inspections total, and avg varroa stat pills', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    expect(screen.getByText('3')).toBeInTheDocument();   // hive_count
    expect(screen.getByText('12')).toBeInTheDocument();  // inspections_total
    expect(screen.getByText('2.5')).toBeInTheDocument(); // average_varroa
  });

  it('shows empty state when apiary has no hives', async () => {
    setupMocks({ hives: [] });
    render(<ApiaryPage />);
    await waitFor(() => expect(screen.getByText('apiary.noHives')).toBeInTheDocument());
  });

  it('renders hive cards with name and type', async () => {
    setupMocks({
      hives: [
        { id: 'h-1', name: 'Hive Alpha', hive_type: 'langstroth', apiary_id: 'apiary-1' },
        { id: 'h-2', name: 'Hive Beta', hive_type: 'dadant', apiary_id: 'apiary-1' },
      ],
    });
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByText('Hive Alpha')).toBeInTheDocument();
    expect(screen.getByText('langstroth')).toBeInTheDocument();
    expect(screen.getByText('Hive Beta')).toBeInTheDocument();
    // Each hive card links to hive detail
    expect(screen.getByRole('link', { name: /Hive Alpha/i })).toHaveAttribute('href', '/dashboard/hive/h-1');
  });
});
