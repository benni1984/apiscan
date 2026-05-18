import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import MembersTeaser from '@/components/MembersTeaser';

const mockGetMe = vi.hoisted(() => vi.fn());
const mockGetPublicStats = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  getMe: mockGetMe,
  getPublicStats: mockGetPublicStats,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockStats = {
  apiary_count: 10, hive_count: 50, inspection_count: 200,
  avg_varroa_count: 2.8,
  mood_distribution: { calm: 100, nervous: 20, aggressive: 5 },
  avg_brood_frames: 5.2,
  avg_inspection_interval_days: 14.3,
  apiaries: [],
};

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01', is_admin: false, is_supporter: false };
const mockSupporter = { ...mockUser, is_supporter: true };
const mockAdmin = { ...mockUser, is_admin: true };

describe('MembersTeaser', () => {
  beforeEach(() => {
    mockGetMe.mockReset();
    mockGetPublicStats.mockReset();
  });

  it('renders stat values unblurred for supporter', async () => {
    mockGetMe.mockResolvedValue(mockSupporter);
    mockGetPublicStats.mockResolvedValue(mockStats);
    const { container } = render(<MembersTeaser />);
    await waitFor(() => screen.getByText('2.8'));
    expect(screen.getByText('2.8')).toBeInTheDocument();
    // calm% = 100/(100+20+5)*100 = 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('5.2')).toBeInTheDocument();
    expect(screen.getByText('14.3d')).toBeInTheDocument();
    // no blur on preview
    const preview = container.querySelector('.members-preview') as HTMLElement;
    expect(preview.style.filter).toBe('');
  });

  it('renders stat values unblurred for admin', async () => {
    mockGetMe.mockResolvedValue(mockAdmin);
    mockGetPublicStats.mockResolvedValue(mockStats);
    const { container } = render(<MembersTeaser />);
    await waitFor(() => screen.getByText('2.8'));
    const preview = container.querySelector('.members-preview') as HTMLElement;
    expect(preview.style.filter).toBe('');
  });

  it('renders stat values unblurred for any logged-in user', async () => {
    mockGetMe.mockResolvedValue(mockUser);
    mockGetPublicStats.mockResolvedValue(mockStats);
    const { container } = render(<MembersTeaser />);
    await waitFor(() => screen.getByText('2.8'));
    const preview = container.querySelector('.members-preview') as HTMLElement;
    expect(preview.style.filter).toBe('');
  });

  it('shows supporter gate for logged-in non-supporters', async () => {
    mockGetMe.mockResolvedValue(mockUser);
    mockGetPublicStats.mockResolvedValue(mockStats);
    render(<MembersTeaser />);
    await waitFor(() => screen.getByText('gate.title'));
    expect(screen.getByText('gate.title')).toBeInTheDocument();
    expect(screen.queryByText('gate.loginTitle')).not.toBeInTheDocument();
  });

  it('shows login gate for anonymous users', async () => {
    mockGetMe.mockRejectedValue(new Error('unauthorized'));
    mockGetPublicStats.mockResolvedValue(mockStats);
    const { container } = render(<MembersTeaser />);
    await waitFor(() => screen.getByText('gate.loginTitle'));
    expect(screen.getByText('gate.loginTitle')).toBeInTheDocument();
    expect(screen.getByText('gate.loginCta')).toBeInTheDocument();
    // stats are blurred for anonymous
    const preview = container.querySelector('.members-preview') as HTMLElement;
    expect(preview.style.filter).toBe('blur(6px)');
  });

  it('shows — for null stats fields', async () => {
    mockGetMe.mockResolvedValue(mockSupporter);
    mockGetPublicStats.mockResolvedValue({
      ...mockStats, avg_varroa_count: null, avg_brood_frames: null, avg_inspection_interval_days: null, mood_distribution: {},
    });
    render(<MembersTeaser />);
    await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3));
  });

  it('shows unlocked badge for supporter', async () => {
    mockGetMe.mockResolvedValue(mockSupporter);
    mockGetPublicStats.mockResolvedValue(mockStats);
    render(<MembersTeaser />);
    await waitFor(() => screen.getByText(/gate.unlockedBadge/));
    expect(screen.getByText(/gate.unlockedBadge/)).toBeInTheDocument();
  });

  it('still renders login gate when getPublicStats fails', async () => {
    mockGetMe.mockRejectedValue(new Error('unauthorized'));
    mockGetPublicStats.mockRejectedValue(new Error('network error'));
    render(<MembersTeaser />);
    await waitFor(() => screen.getByText('gate.loginTitle'));
    expect(screen.getByText('gate.loginTitle')).toBeInTheDocument();
  });
});
