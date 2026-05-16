import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HivePage from '@/app/[locale]/dashboard/hive/[id]/page';

const mockGetHive = vi.hoisted(() => vi.fn());
const mockGetHiveStats = vi.hoisted(() => vi.fn());
const mockGetInspections = vi.hoisted(() => vi.fn());
const mockUpdateHive = vi.hoisted(() => vi.fn());
const mockDeleteHive = vi.hoisted(() => vi.fn());
const mockCreateInspection = vi.hoisted(() => vi.fn());
const mockUpdateInspection = vi.hoisted(() => vi.fn());
const mockDeleteInspection = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
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
  updateHive: mockUpdateHive,
  deleteHive: mockDeleteHive,
  createInspection: mockCreateInspection,
  updateInspection: mockUpdateInspection,
  deleteInspection: mockDeleteInspection,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 50 });

describe('HivePage', () => {
  beforeEach(() => {
    mockGetHive.mockClear();
    mockGetHiveStats.mockClear();
    mockGetInspections.mockClear();
    mockUpdateHive.mockClear();
    mockDeleteHive.mockClear();
    mockCreateInspection.mockClear();
    mockUpdateInspection.mockClear();
    mockDeleteInspection.mockClear();
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

  it('shows Edit Hive button after load', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByText('hive.editBtn')).toBeInTheDocument();
  });

  it('clicking Edit Hive shows the form pre-filled with hive name', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.editBtn'));
    expect(screen.getByText('hive.editTitle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hive Alpha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('langstroth')).toBeInTheDocument();
  });

  it('cancel closes the edit form', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.editBtn'));
    expect(screen.getByText('hive.editTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByText('apiaries.cancel'));
    expect(screen.queryByText('hive.editTitle')).not.toBeInTheDocument();
  });

  it('saving edit calls updateHive and reflects new name', async () => {
    setupMocks();
    mockUpdateHive.mockResolvedValueOnce({
      id: 'hive-1', name: 'Renamed Hive', hive_type: 'dadant', apiary_id: 'apiary-1',
    });
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));

    fireEvent.click(screen.getByText('hive.editBtn'));
    const nameInput = screen.getByDisplayValue('Hive Alpha');
    fireEvent.change(nameInput, { target: { value: 'Renamed Hive' } });
    fireEvent.submit(screen.getByText('hive.saveBtn').closest('form')!);

    await waitFor(() => expect(mockUpdateHive).toHaveBeenCalledWith(
      'hive-1',
      expect.objectContaining({ name: 'Renamed Hive' })
    ));
    await waitFor(() => expect(screen.getByText('Renamed Hive')).toBeInTheDocument());
    expect(screen.queryByText('hive.editTitle')).not.toBeInTheDocument();
    expect(screen.getByText('hive.saveSuccess')).toBeInTheDocument();
  });

  it('shows error banner when updateHive fails', async () => {
    setupMocks();
    mockUpdateHive.mockRejectedValueOnce(new Error('Update failed'));
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.editBtn'));
    fireEvent.submit(screen.getByText('hive.saveBtn').closest('form')!);
    await waitFor(() => expect(screen.getByText('Update failed')).toBeInTheDocument());
  });

  it('shows Delete Hive button and confirmation step', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByText('hive.deleteBtn')).toBeInTheDocument();
    fireEvent.click(screen.getByText('hive.deleteBtn'));
    expect(screen.getByText('hive.deleteConfirmBtn')).toBeInTheDocument();
    expect(screen.getByText('hive.deleteConfirmText')).toBeInTheDocument();
  });

  it('confirming delete calls deleteHive', async () => {
    setupMocks();
    mockDeleteHive.mockResolvedValueOnce(undefined);
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.deleteBtn'));
    fireEvent.click(screen.getByText('hive.deleteConfirmBtn'));
    await waitFor(() => expect(mockDeleteHive).toHaveBeenCalledWith('hive-1'));
  });

  it('shows error message when deleteHive fails', async () => {
    setupMocks();
    mockDeleteHive.mockRejectedValueOnce(new Error('Delete failed'));
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.deleteBtn'));
    fireEvent.click(screen.getByText('hive.deleteConfirmBtn'));
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeInTheDocument());
    expect(screen.getByText('hive.deleteBtn')).toBeInTheDocument();
  });

  // ── Inspection CRUD ────────────────────────────────────────────────────────

  it('shows New Inspection button after load', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    expect(screen.getByText('hive.newInspectionBtn')).toBeInTheDocument();
  });

  it('clicking New Inspection shows the create form', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.newInspectionBtn'));
    expect(screen.getByText('hive.addInspectionTitle')).toBeInTheDocument();
    expect(screen.getByText('hive.inspectionSaveBtn')).toBeInTheDocument();
  });

  it('cancel hides the inspection form', async () => {
    setupMocks();
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.newInspectionBtn'));
    fireEvent.click(screen.getByText('apiaries.cancel'));
    expect(screen.queryByText('hive.addInspectionTitle')).not.toBeInTheDocument();
  });

  it('submitting create form calls createInspection and prepends the new row', async () => {
    setupMocks();
    const newInspection = { id: 'i-new', date: '2024-08-01', varroa_count: 2, mood: 'calm', queen_seen: true, brood_frames: 4 };
    mockCreateInspection.mockResolvedValueOnce(newInspection);
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));

    fireEvent.click(screen.getByText('hive.newInspectionBtn'));
    fireEvent.submit(screen.getByText('hive.inspectionSaveBtn').closest('form')!);

    await waitFor(() => expect(mockCreateInspection).toHaveBeenCalledWith(
      'hive-1', expect.objectContaining({ date: expect.any(String) })
    ));
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.queryByText('hive.addInspectionTitle')).not.toBeInTheDocument();
    expect(screen.getByText('hive.inspectionSaveSuccess')).toBeInTheDocument();
  });

  it('shows error banner when createInspection fails', async () => {
    setupMocks();
    mockCreateInspection.mockRejectedValueOnce(new Error('Create failed'));
    render(<HivePage />);
    await waitFor(() => screen.getByText('Hive Alpha'));
    fireEvent.click(screen.getByText('hive.newInspectionBtn'));
    fireEvent.submit(screen.getByText('hive.inspectionSaveBtn').closest('form')!);
    await waitFor(() => expect(screen.getByText('Create failed')).toBeInTheDocument());
  });

  it('Edit button on inspection row opens edit form pre-filled', async () => {
    setupMocks({
      inspections: [{ id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 }],
    });
    render(<HivePage />);
    await waitFor(() => screen.getByText('3'));
    fireEvent.click(screen.getByText('hive.inspectionEditBtn'));
    expect(screen.getByText('hive.editInspectionTitle')).toBeInTheDocument();
    expect(screen.getByText('hive.inspectionUpdateBtn')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-06-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('submitting edit form calls updateInspection and updates the row', async () => {
    setupMocks({
      inspections: [{ id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 }],
    });
    const updated = { id: 'i-1', date: '2024-06-01', varroa_count: 7, mood: 'nervous', queen_seen: false, brood_frames: 5 };
    mockUpdateInspection.mockResolvedValueOnce(updated);
    render(<HivePage />);
    await waitFor(() => screen.getByText('3'));

    fireEvent.click(screen.getByText('hive.inspectionEditBtn'));
    const varroaInput = screen.getByDisplayValue('3');
    fireEvent.change(varroaInput, { target: { value: '7' } });
    fireEvent.submit(screen.getByText('hive.inspectionUpdateBtn').closest('form')!);

    await waitFor(() => expect(mockUpdateInspection).toHaveBeenCalledWith(
      'i-1', expect.objectContaining({ varroa_count: 7 })
    ));
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    expect(screen.queryByText('hive.editInspectionTitle')).not.toBeInTheDocument();
    expect(screen.getByText('hive.inspectionUpdateSuccess')).toBeInTheDocument();
  });

  it('Delete button shows confirmation step', async () => {
    setupMocks({
      inspections: [{ id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 }],
    });
    render(<HivePage />);
    await waitFor(() => screen.getByText('3'));
    fireEvent.click(screen.getByText('hive.inspectionDeleteBtn'));
    expect(screen.getByText('hive.inspectionConfirmDeleteText')).toBeInTheDocument();
    expect(screen.getByText('hive.inspectionConfirmDeleteBtn')).toBeInTheDocument();
  });

  it('confirming delete calls deleteInspection and removes the row', async () => {
    setupMocks({
      inspections: [{ id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 }],
    });
    mockDeleteInspection.mockResolvedValueOnce(undefined);
    render(<HivePage />);
    await waitFor(() => screen.getByText('3'));
    fireEvent.click(screen.getByText('hive.inspectionDeleteBtn'));
    fireEvent.click(screen.getByText('hive.inspectionConfirmDeleteBtn'));
    await waitFor(() => expect(mockDeleteInspection).toHaveBeenCalledWith('i-1'));
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('shows error when deleteInspection fails and row stays', async () => {
    setupMocks({
      inspections: [{ id: 'i-1', date: '2024-06-01', varroa_count: 3, mood: 'calm', queen_seen: true, brood_frames: 5 }],
    });
    mockDeleteInspection.mockRejectedValueOnce(new Error('Delete failed'));
    render(<HivePage />);
    await waitFor(() => screen.getByText('3'));
    fireEvent.click(screen.getByText('hive.inspectionDeleteBtn'));
    fireEvent.click(screen.getByText('hive.inspectionConfirmDeleteBtn'));
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
