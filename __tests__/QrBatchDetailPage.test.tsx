import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import QrBatchDetailPage from '@/app/[locale]/dashboard/qr-batches/[id]/page';

const mockGetQrBatch = vi.hoisted(() => vi.fn());
const mockDownloadQrBatchPdf = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'b-1' }),
}));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  getQrBatch: mockGetQrBatch,
  downloadQrBatchPdf: mockDownloadQrBatchPdf,
}));

const batch = {
  id: 'b-1',
  count: 3,
  created_at: '2024-06-01T10:00:00Z',
  tokens: [
    { token: 'aaaa-bbbb-cccc-dddd', linked_hive_id: 'hive-1' },
    { token: 'eeee-ffff-0000-1111', linked_hive_id: null },
    { token: '2222-3333-4444-5555', linked_hive_id: null },
  ],
};

describe('QrBatchDetailPage', () => {
  beforeEach(() => {
    mockGetQrBatch.mockClear();
    mockDownloadQrBatchPdf.mockClear();
  });

  it('shows page title and back link', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    render(<QrBatchDetailPage />);
    expect(screen.getByText('qrBatches.detailTitle')).toBeDefined();
    expect(screen.getByText('qrBatches.backToList')).toBeDefined();
  });

  it('shows stat pills with total count and linked count', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    render(<QrBatchDetailPage />);
    await waitFor(() => screen.getByText('qrBatches.total'));
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it('renders token chips for each token', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    render(<QrBatchDetailPage />);
    await waitFor(() => screen.getByText('qrBatches.tokens'));
    expect(screen.getAllByText('qrBatches.linkedBadge').length).toBe(1);
    expect(screen.getAllByText('qrBatches.unlinkedBadge').length).toBe(2);
  });

  it('shows download PDF button', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    render(<QrBatchDetailPage />);
    await waitFor(() => screen.getByText('qrBatches.downloadPdf'));
  });

  it('calls downloadQrBatchPdf and triggers download on button click', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    mockDownloadQrBatchPdf.mockResolvedValue(blob);
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    render(<QrBatchDetailPage />);
    await waitFor(() => screen.getByText('qrBatches.downloadPdf'));
    fireEvent.click(screen.getByText('qrBatches.downloadPdf'));
    await waitFor(() => expect(mockDownloadQrBatchPdf).toHaveBeenCalledWith('b-1'));
    vi.unstubAllGlobals();
  });

  it('shows error banner when PDF download fails', async () => {
    mockGetQrBatch.mockResolvedValue(batch);
    mockDownloadQrBatchPdf.mockRejectedValue(new Error('PDF error'));
    render(<QrBatchDetailPage />);
    await waitFor(() => screen.getByText('qrBatches.downloadPdf'));
    fireEvent.click(screen.getByText('qrBatches.downloadPdf'));
    await waitFor(() => screen.getByText('qrBatches.errorGeneric'));
  });
});
