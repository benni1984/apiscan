import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HivePage from '@/app/[locale]/dashboard/hive/[id]/page';

const mockGetHive = vi.hoisted(() => vi.fn());
const mockGetHiveStats = vi.hoisted(() => vi.fn());
const mockGetInspections = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'hive-1' }),
}));

vi.mock('next/dynamic', () => ({
  default: (_importFn: unknown, _opts?: unknown) =>
    function MockVarroaChart() { return <canvas data-testid="varroa-chart" />; },
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getHive: mockGetHive,
  getHiveStats: mockGetHiveStats,
  getInspections: mockGetInspections,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 50 });

describe('HivePage', () => {
  beforeEach(() => {
    mockGetHive.mockClear();
    mockGetHiveStats.mockClear();
    mockGetInspections.mockClear();
  });

  function setupMocks({
    hive = { id: 'hive-1', name: 'Hive Alpha', hive_type: 'langstroth', apiary_id: 'apiary-1' },
    stats = { inspection_count: 0, varroa_trend: [] as { date: string; value: number }[], mood_distribution: {} },
    inspections = [] as { id: string; date: string; varroa_count?: number; mood?: string; queen_seen?: boolean; brood_frames?: number }[],
  } = {}) {
    mockGetHive.mockResolvedValueOnce(hive);
    mockGetHiveStats.mockResolvedValueOnce(stats);
    mockGetInspections.mockResolvedValueOnce(paginated(inspections));
  }

  it('shows hive name and type after loading', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => expect(screen.getByText('Hive Alpha')).toBeInTheDocument());
    expect(screen.getByText('langstroth')).toBeInTheDocument();
  });

  it('shows empty inspection state when hive has no inspections', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => expect(screen.getByText('hive.noInspections')).toBeInTheDocument());
  });

  it('renders inspection table rows when inspections exist', async () => {
    setupMocks({
      inspections: [
        { id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 },
        { id: 'i-2', date: '2024-07-01', varroa_count: 0, mood: 'nervous', queen_seen: false, brood_frames: 4 },
      ],
    });
    render(<HivePage />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('hive.yes')).toBeInTheDocument();
    expect(screen.getByText('hive.no')).toBeInTheDocument();
  });

  it('shows varroa chart when trend data is present', async () => {
    setupMocks({
      stats: { inspection_count: 1, varroa_trend: [{ date: '2024-06-01', value: 5 }], mood_distribution: {} },
    });
    render(<HivePage />);
    await waitFor(() => expect(screen.getByTestId('varroa-chart')).toBeInTheDocument());
  });

  it('shows no-trend message when varroa_trend is empty', async () => {
    setupMocks({ stats: { inspection_count: 0, varroa_trend: [], mood_distribution: {} } });
    render(<HivePage />);
    await waitFor(() => expect(screen.getByText('hive.noTrend')).toBeInTheDocument());
  });

  it('back link points to parent apiary', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByRole('link', { name: /Hive Alpha/i })).toHaveAttribute('href', '/dashboard/apiary/apiary-1');
  });
});
