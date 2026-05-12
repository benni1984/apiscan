import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import LiveStats from '@/components/LiveStats';

const LABELS = {
  apiaries: 'Apiaries',
  hives: 'Hives',
  inspections: 'Inspections',
  countries: 'Countries',
};

function makeStatsResponse(apiary_count: number, hive_count: number, inspection_count: number) {
  return new Response(
    JSON.stringify({ apiary_count, hive_count, inspection_count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  // Make requestAnimationFrame run the callback synchronously at t+10s so
  // the cubic-easing value reaches 1.0 and the counter lands on the final value.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(performance.now() + 10_000);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LiveStats', () => {
  it('renders all four stat labels', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeStatsResponse(0, 0, 0));
    render(<LiveStats labels={LABELS} />);
    expect(screen.getByText('Apiaries')).toBeInTheDocument();
    expect(screen.getByText('Hives')).toBeInTheDocument();
    expect(screen.getByText('Inspections')).toBeInTheDocument();
    expect(screen.getByText('Countries')).toBeInTheDocument();
  });

  it('shows placeholder dashes before data loads', () => {
    // Never resolves during this test
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}));
    render(<LiveStats labels={LABELS} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('fetches from /api/v1/public/stats on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeStatsResponse(1, 2, 3));
    render(<LiveStats labels={LABELS} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/v1/public/stats'));
  });

  it('shows animated counts after data loads', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeStatsResponse(5, 20, 100));
    render(<LiveStats labels={LABELS} />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('keeps placeholder dashes on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    render(<LiveStats labels={LABELS} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('always shows 42+ for the countries stat', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeStatsResponse(0, 0, 0));
    render(<LiveStats labels={LABELS} />);
    expect(screen.getByText('42+')).toBeInTheDocument();
  });

  it('replaces dashes with numeric values after data loads', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeStatsResponse(1, 1, 1));
    render(<LiveStats labels={LABELS} />);
    await waitFor(() => {
      // After load, at most one "—" should remain (countries is hardcoded, others animate)
      expect(screen.queryAllByText('—').length).toBeLessThan(3);
    });
  });
});
