import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ApiaryPage from '@/app/[locale]/dashboard/apiary/[id]/page';

const mockGetApiary = vi.hoisted(() => vi.fn());
const mockGetHives = vi.hoisted(() => vi.fn());
const mockGetApiaryStats = vi.hoisted(() => vi.fn());
const mockUpdateApiary = vi.hoisted(() => vi.fn());
const mockDeleteApiary = vi.hoisted(() => vi.fn());
const mockCreateHive = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
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
  updateApiary: mockUpdateApiary,
  deleteApiary: mockDeleteApiary,
  createHive: mockCreateHive,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 100 });

describe('ApiaryPage', () => {
  beforeEach(() => {
    mockGetApiary.mockClear();
    mockGetHives.mockClear();
    mockGetApiaryStats.mockClear();
    mockUpdateApiary.mockClear();
    mockDeleteApiary.mockClear();
    mockCreateHive.mockClear();
  });

  function setupMocks({
    apiary = { id: 'apiary-1', name: 'My Apiary', hive_count: 3, is_public: false, created_at: '2025-01-01T00:00:00Z' },
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
    expect(screen.getByRole('link', { name: /Hive Alpha/i })).toHaveAttribute('href', '/dashboard/hive/h-1');
  });

  it('shows Edit Apiary button after load', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    expect(screen.getByText('apiary.editBtn')).toBeInTheDocument();
  });

  it('clicking Edit Apiary shows the edit form pre-filled with apiary name', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.editBtn'));
    expect(screen.getByText('apiary.editTitle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Apiary')).toBeInTheDocument();
  });

  it('cancel closes the edit form', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.editBtn'));
    expect(screen.getByText('apiary.editTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByText('apiaries.cancel'));
    expect(screen.queryByText('apiary.editTitle')).not.toBeInTheDocument();
  });

  it('saving edit calls updateApiary and reflects the new name', async () => {
    const apiary = { id: 'apiary-1', name: 'My Apiary', hive_count: 0, is_public: false, created_at: '2025-01-01T00:00:00Z' };
    mockGetApiary.mockResolvedValueOnce(apiary);
    mockGetHives.mockResolvedValueOnce(paginated([]));
    mockGetApiaryStats.mockResolvedValueOnce({ hive_count: 0, inspections_total: 0, mood_distribution: {} });
    mockUpdateApiary.mockResolvedValueOnce({ ...apiary, name: 'Renamed Apiary' });

    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.editBtn'));

    const nameInput = screen.getByDisplayValue('My Apiary');
    fireEvent.change(nameInput, { target: { value: 'Renamed Apiary' } });
    fireEvent.submit(screen.getByText('apiary.saveBtn').closest('form')!);

    await waitFor(() => expect(mockUpdateApiary).toHaveBeenCalledWith(
      'apiary-1',
      expect.objectContaining({ name: 'Renamed Apiary' })
    ));
    await waitFor(() => expect(screen.getByText('Renamed Apiary')).toBeInTheDocument());
    expect(screen.queryByText('apiary.editTitle')).not.toBeInTheDocument();
    expect(screen.getByText('apiary.saveSuccess')).toBeInTheDocument();
  });

  it('shows error banner when updateApiary fails', async () => {
    setupMocks();
    mockUpdateApiary.mockRejectedValueOnce(new Error('Update failed'));
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.editBtn'));
    fireEvent.submit(screen.getByText('apiary.saveBtn').closest('form')!);
    await waitFor(() => expect(screen.getByText('Update failed')).toBeInTheDocument());
  });

  it('shows Delete Apiary button and confirmation step', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    expect(screen.getByText('apiary.deleteBtn')).toBeInTheDocument();
    fireEvent.click(screen.getByText('apiary.deleteBtn'));
    expect(screen.getByText('apiary.deleteConfirmBtn')).toBeInTheDocument();
    expect(screen.getByText('apiary.deleteConfirmText')).toBeInTheDocument();
  });

  it('confirming delete calls deleteApiary', async () => {
    setupMocks();
    mockDeleteApiary.mockResolvedValueOnce(undefined);
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.deleteBtn'));
    fireEvent.click(screen.getByText('apiary.deleteConfirmBtn'));
    await waitFor(() => expect(mockDeleteApiary).toHaveBeenCalledWith('apiary-1'));
  });

  it('shows New Hive button', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    expect(screen.getByText('apiary.newHive')).toBeInTheDocument();
  });

  it('clicking New Hive opens the create form', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.newHive'));
    expect(screen.getByText('apiary.createHiveTitle')).toBeInTheDocument();
  });

  it('cancel hides the create hive form', async () => {
    setupMocks();
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.newHive'));
    fireEvent.click(screen.getByText('apiaries.cancel'));
    expect(screen.queryByText('apiary.createHiveTitle')).not.toBeInTheDocument();
  });

  it('submitting create hive calls createHive and appends new card', async () => {
    setupMocks();
    const newHive = { id: 'h-new', name: 'My Hive', hive_type: 'langstroth', apiary_id: 'apiary-1' };
    mockCreateHive.mockResolvedValueOnce(newHive);
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));

    fireEvent.click(screen.getByText('apiary.newHive'));
    // Name is the last text input in the create form
    const nameInput = screen.getByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'My Hive' } });
    fireEvent.submit(screen.getByText('apiary.createHiveBtn').closest('form')!);

    await waitFor(() => expect(mockCreateHive).toHaveBeenCalledWith(
      'apiary-1',
      expect.objectContaining({ name: 'My Hive', hive_type: 'langstroth' })
    ));
    await waitFor(() => expect(screen.getByText('My Hive')).toBeInTheDocument());
    expect(screen.queryByText('apiary.createHiveTitle')).not.toBeInTheDocument();
  });

  it('shows error banner when createHive fails', async () => {
    setupMocks();
    mockCreateHive.mockRejectedValueOnce(new Error('Create failed'));
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));

    fireEvent.click(screen.getByText('apiary.newHive'));
    const nameInput = screen.getByDisplayValue('');
    fireEvent.change(nameInput, { target: { value: 'Bad Hive' } });
    fireEvent.submit(screen.getByText('apiary.createHiveBtn').closest('form')!);

    await waitFor(() => expect(screen.getByText('Create failed')).toBeInTheDocument());
  });

  it('shows has-hives error on 409 without redirecting', async () => {
    setupMocks();
    mockDeleteApiary.mockRejectedValueOnce(new Error('has_hives'));
    render(<ApiaryPage />);
    await waitFor(() => screen.getByText('My Apiary'));
    fireEvent.click(screen.getByText('apiary.deleteBtn'));
    fireEvent.click(screen.getByText('apiary.deleteConfirmBtn'));
    await waitFor(() => expect(screen.getByText('apiary.deleteHasHives')).toBeInTheDocument());
    expect(screen.getByText('apiary.deleteBtn')).toBeInTheDocument();
  });
});
