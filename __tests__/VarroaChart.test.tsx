import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import VarroaChart from '@/components/VarroaChart';

const mockDestroy = vi.fn();
const MockChart = vi.fn().mockImplementation(() => ({ destroy: mockDestroy }));

vi.mock('chart.js/auto', () => ({ Chart: MockChart }));

beforeEach(() => {
  MockChart.mockClear();
  mockDestroy.mockClear();
});

describe('VarroaChart', () => {
  it('renders a canvas element', () => {
    const { container } = render(<VarroaChart data={[]} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('does not instantiate Chart when data is empty', async () => {
    render(<VarroaChart data={[]} />);
    await new Promise(r => setTimeout(r, 50));
    expect(MockChart).not.toHaveBeenCalled();
  });

  it('instantiates Chart with correct labels and values', async () => {
    const data = [
      { date: '2024-01-01', value: 5 },
      { date: '2024-02-01', value: 10 },
    ];
    render(<VarroaChart data={data} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    const [, config] = MockChart.mock.calls[0] as [HTMLCanvasElement, { type: string; data: { labels: string[] } }];
    expect(config.type).toBe('line');
    expect(config.data.labels).toEqual(['2024-01-01', '2024-02-01']);
  });

  it('destroys Chart instance on unmount', async () => {
    const data = [{ date: '2024-01-01', value: 3 }];
    const { unmount } = render(<VarroaChart data={data} />);
    await waitFor(() => expect(MockChart).toHaveBeenCalled());
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });
});
