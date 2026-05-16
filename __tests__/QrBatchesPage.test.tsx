import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import QrBatchesPage from '@/app/[locale]/dashboard/qr-batches/page';

const mockGetQrBatches = vi.hoisted(() => vi.fn());
const mockCreateQrBatch = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getQrBatches: mockGetQrBatches,
  createQrBatch: mockCreateQrBatch,
}));

const paginated = <T,>(items: T[]) => ({ items, total: items.length, page: 1, per_page: 20, pages: 1 });

const batch1 = { id: 'b-1', count: 10, created_at: '2024-06-01T10:00:00Z', linked_count: 3 };
const batch2 = { id: 'b-2', count: 5, created_at: '2024-05-15T08:00:00Z', linked_count: 5 };

describe('QrBatchesPage', () => {
  beforeEach(() => {
    mockGetQrBatches.mockClear();
    mockCreateQrBatch.mockClear();
  });

  it('shows page title', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    render(<QrBatchesPage />);
    expect(screen.getByText('qrBatches.title')).toBeDefined();
  });

  it('shows empty state when no batches', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    render(<QrBatchesPage />);
    await waitFor(() => expect(screen.getByText('qrBatches.empty')).toBeDefined());
  });

  it('renders batch rows with count and linked', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([batch1, batch2]));
    render(<QrBatchesPage />);
    await waitFor(() => expect(screen.getByText('10')).toBeDefined());
    expect(screen.getByText('3 / 10')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('5 / 5')).toBeDefined();
  });

  it('each batch row has a View link to the detail page', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([batch1]));
    render(<QrBatchesPage />);
    await waitFor(() => screen.getByText('qrBatches.view'));
    const link = screen.getByText('qrBatches.view').closest('a');
    expect(link?.getAttribute('href')).toContain('/dashboard/qr-batches/b-1');
  });

  it('shows create form when New Batch button is clicked', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    render(<QrBatchesPage />);
    await waitFor(() => screen.getByText('qrBatches.empty'));
    fireEvent.click(screen.getByText('qrBatches.new'));
    expect(screen.getByText('qrBatches.createTitle')).toBeDefined();
    expect(screen.getByText('qrBatches.createBtn')).toBeDefined();
    expect(screen.getByText('qrBatches.cancel')).toBeDefined();
  });

  it('cancel hides the create form', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    render(<QrBatchesPage />);
    await waitFor(() => screen.getByText('qrBatches.empty'));
    fireEvent.click(screen.getByText('qrBatches.new'));
    fireEvent.click(screen.getByText('qrBatches.cancel'));
    expect(screen.queryByText('qrBatches.createTitle')).toBeNull();
  });

  it('calls createQrBatch and prepends new batch on success', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    const newBatch = { id: 'b-new', count: 8, created_at: '2024-07-01T00:00:00Z', tokens: [] };
    mockCreateQrBatch.mockResolvedValue(newBatch);
    render(<QrBatchesPage />);
    await waitFor(() => screen.getByText('qrBatches.empty'));
    fireEvent.click(screen.getByText('qrBatches.new'));
    fireEvent.submit(screen.getByText('qrBatches.createBtn').closest('form')!);
    await waitFor(() => expect(mockCreateQrBatch).toHaveBeenCalledWith(10));
    await waitFor(() => screen.getByText('qrBatches.createSuccess'));
  });

  it('shows error banner when createQrBatch fails', async () => {
    mockGetQrBatches.mockResolvedValue(paginated([]));
    mockCreateQrBatch.mockRejectedValue(new Error('Server error'));
    render(<QrBatchesPage />);
    await waitFor(() => screen.getByText('qrBatches.empty'));
    fireEvent.click(screen.getByText('qrBatches.new'));
    fireEvent.submit(screen.getByText('qrBatches.createBtn').closest('form')!);
    await waitFor(() => screen.getByText('Server error'));
  });
});
