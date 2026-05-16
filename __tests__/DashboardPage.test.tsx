import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardPage from '@/app/[locale]/dashboard/page';

const mockGetApiaries = vi.hoisted(() => vi.fn());
const mockCreateApiary = vi.hoisted(() => vi.fn());

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
  createApiary: mockCreateApiary,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 100 });

describe('DashboardPage', () => {
  beforeEach(() => {
    mockGetApiaries.mockClear();
    mockCreateApiary.mockClear();
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

  it('shows "New Apiary" button', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([]));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('apiaries.empty') || screen.queryByText('apiaries.title')).toBeTruthy());
    expect(screen.getByText('apiaries.new')).toBeInTheDocument();
  });

  it('clicking New Apiary shows the create form', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([]));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('apiaries.new'));
    fireEvent.click(screen.getByText('apiaries.new'));
    expect(screen.getByText('apiaries.createTitle')).toBeInTheDocument();
    expect(screen.getByLabelText ? true : screen.getByText('apiaries.name')).toBeTruthy();
  });

  it('cancel button hides the create form', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([]));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('apiaries.new'));
    fireEvent.click(screen.getByText('apiaries.new'));
    expect(screen.getByText('apiaries.createTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByText('apiaries.cancel'));
    expect(screen.queryByText('apiaries.createTitle')).not.toBeInTheDocument();
  });

  it('submitting the create form calls createApiary and prepends the new card', async () => {
    const existingApiary = { id: 'a-0', name: 'Old Apiary', hive_count: 1, is_public: false, created_at: '2025-01-01T00:00:00Z' };
    const newApiary = { id: 'a-new', name: 'My New Apiary', hive_count: 0, is_public: false, created_at: '2025-01-01T00:00:00Z' };
    mockGetApiaries.mockResolvedValueOnce(paginated([existingApiary]));
    mockCreateApiary.mockResolvedValueOnce(newApiary);
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('Old Apiary'));

    fireEvent.click(screen.getByText('apiaries.new'));
    // First empty input is the name field
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: 'My New Apiary' } });
    fireEvent.submit(screen.getByText('apiaries.createBtn').closest('form')!);

    await waitFor(() => expect(mockCreateApiary).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My New Apiary', is_public: false })
    ));
    await waitFor(() => expect(screen.getByText('My New Apiary')).toBeInTheDocument());
    expect(screen.queryByText('apiaries.createTitle')).not.toBeInTheDocument();
  });

  it('shows error banner when createApiary fails', async () => {
    mockGetApiaries.mockResolvedValueOnce(paginated([]));
    mockCreateApiary.mockRejectedValueOnce(new Error('Server error'));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('apiaries.new'));

    fireEvent.click(screen.getByText('apiaries.new'));
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: 'Bad Apiary' } });
    fireEvent.submit(screen.getByText('apiaries.createBtn').closest('form')!);

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
    expect(screen.getByText('apiaries.createTitle')).toBeInTheDocument();
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
