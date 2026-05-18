import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockReplace = vi.hoisted(() => vi.fn());
const mockGetPublicStats = vi.hoisted(() => vi.fn());
const mockUseDashboardAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  getPublicStats: mockGetPublicStats,
  logout: vi.fn(),
}));

vi.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: mockUseDashboardAuth,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'community.title': 'Community Dashboard',
      'community.snapshot': 'Global Snapshot',
      'community.health': 'Health Averages',
      'community.avgVarroa': 'Avg Varroa (global)',
      'community.goodMood': 'Hives: Good Mood',
      'community.avgBrood': 'Avg Brood Frames',
      'community.interval': 'Avg Inspection Interval',
      'community.moodChart': 'Hive Mood Distribution',
      'community.cityChart': 'Hives by City (Top 15)',
      'community.sizeChart': 'Apiary Size Distribution',
      'community.apiaryTable': 'Public Apiaries',
      'community.city': 'City',
      'community.other': 'Other / Unknown',
      'community.noData': 'No community data available.',
      'overview.apiaries': 'Apiaries',
      'overview.hives': 'Hives',
      'overview.inspections': 'Inspections',
    };
    return map[key] ?? key;
  },
}));

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const Comp = React.lazy(fn);
    return (props: object) => (
      <React.Suspense fallback={null}>
        <Comp {...props} />
      </React.Suspense>
    );
  },
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children, memberOnly }: { children: React.ReactNode; memberOnly?: boolean }) => {
    const { user } = mockUseDashboardAuth();
    if (memberOnly && user && !user.is_supporter && !user.is_admin) {
      mockReplace('/dashboard');
      return null;
    }
    return <div>{children}</div>;
  },
}));

vi.mock('@/components/MoodChart', () => ({
  default: () => <canvas data-testid="mood-chart" />,
}));

vi.mock('@/components/CityChart', () => ({
  default: () => <canvas data-testid="city-chart" />,
}));

import MembersDashboardPage from '@/app/[locale]/dashboard/members/page';

const SUPPORTER = { id: '1', email: 'a@b.com', name: 'Supporter', locale: 'en', created_at: '2024-01-01', is_admin: false, is_supporter: true };
const ADMIN = { ...SUPPORTER, is_admin: true, is_supporter: false };
const REGULAR = { ...SUPPORTER, is_supporter: false };

const STATS = {
  apiary_count: 42,
  hive_count: 210,
  inspection_count: 1050,
  avg_varroa_count: 3.2,
  mood_distribution: { calm: 800, nervous: 150, aggressive: 50 },
  avg_brood_frames: 6.1,
  avg_inspection_interval_days: 11.4,
  apiaries: [
    { id: 'a1', name: 'Garden', city_name: 'Berlin', hive_count: 8 },
    { id: 'a2', name: 'Meadow', city_name: 'Munich', hive_count: 5 },
    { id: 'a3', name: 'Forest', city_name: null, hive_count: 2 },
  ],
};

describe('MembersDashboardPage', () => {
  beforeEach(() => {
    mockGetPublicStats.mockReset();
    mockReplace.mockReset();
  });

  it('renders title and snapshot pills for supporter', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: SUPPORTER, loading: false });
    mockGetPublicStats.mockResolvedValue(STATS);
    render(<MembersDashboardPage />);
    await waitFor(() => expect(screen.getByText('Community Dashboard')).toBeTruthy());
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('210')).toBeTruthy();
    expect(screen.getByText(/1.?050/)).toBeTruthy();
  });

  it('renders health averages for supporter', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: SUPPORTER, loading: false });
    mockGetPublicStats.mockResolvedValue(STATS);
    render(<MembersDashboardPage />);
    await waitFor(() => expect(screen.getByText('3.2')).toBeTruthy());
    // calm% = 800/(800+150+50)*100 = 80%
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('6.1')).toBeTruthy();
    expect(screen.getByText('11.4d')).toBeTruthy();
  });

  it('renders apiary table rows with city and hive count', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: SUPPORTER, loading: false });
    mockGetPublicStats.mockResolvedValue(STATS);
    render(<MembersDashboardPage />);
    await waitFor(() => expect(screen.getByText('Berlin')).toBeTruthy());
    expect(screen.getByText('Munich')).toBeTruthy();
    expect(screen.getByText('Other / Unknown')).toBeTruthy();
  });

  it('renders title and pills for admin', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: ADMIN, loading: false });
    mockGetPublicStats.mockResolvedValue(STATS);
    render(<MembersDashboardPage />);
    await waitFor(() => expect(screen.getByText('Community Dashboard')).toBeTruthy());
  });

  it('redirects non-supporter to /dashboard', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: REGULAR, loading: false });
    mockGetPublicStats.mockResolvedValue(STATS);
    render(<MembersDashboardPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
    expect(screen.queryByText('Community Dashboard')).toBeNull();
  });

  it('shows — placeholders when averages are null', async () => {
    mockUseDashboardAuth.mockReturnValue({ user: SUPPORTER, loading: false });
    mockGetPublicStats.mockResolvedValue({
      ...STATS,
      avg_varroa_count: null,
      avg_brood_frames: null,
      avg_inspection_interval_days: null,
      mood_distribution: {},
    });
    render(<MembersDashboardPage />);
    await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3));
  });
});
