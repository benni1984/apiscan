import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ── Leaflet mock ────────────────────────────────────────────────────────────
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  fitBounds: vi.fn(),
};
const mockMarker = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() };
const mockTileLayer = { addTo: vi.fn().mockReturnThis() };
const mockGeoJSON = { addTo: vi.fn().mockReturnThis() };
const mockLayersControl = { addTo: vi.fn().mockReturnThis() };

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => mockMarker),
    geoJSON: vi.fn(() => mockGeoJSON),
    control: { layers: vi.fn(() => mockLayersControl) },
    Control: class MockControl {
      options: object;
      constructor(opts: object) { this.options = opts; }
      addTo() { return this; }
      onAdd: (() => HTMLElement) | undefined;
    },
    DomUtil: { create: vi.fn(() => document.createElement('div')) },
  },
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

// ── Helpers ─────────────────────────────────────────────────────────────────
const labels = {
  apiaries: 'Apiaries', hives: 'Hives', inspections: 'Inspections',
  hiveSingular: 'hive', hivePlural: 'hives', viewDetails: 'View details',
  heatmapToggle: 'Varroa heatmap', heatmapLow: 'Low (< 2)',
  heatmapMedium: 'Medium (2–5)', heatmapHigh: 'High (> 5)',
};

const STATS = { apiary_count: 5, hive_count: 20, inspection_count: 100, apiaries: [] };
const HEATMAP_EMPTY = { type: 'FeatureCollection', features: [] };
const HEATMAP_WITH_DATA = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[[9.75, 47.75], [10.25, 47.75], [10.25, 48.25], [9.75, 48.25], [9.75, 47.75]]] },
    properties: { avg_varroa: 3.2, apiary_count: 4, inspection_count: 23 },
  }],
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('MapClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(ok(STATS)).mockResolvedValueOnce(ok(HEATMAP_EMPTY));
  });

  it('renders map stats bar with placeholder dashes before fetch resolves', async () => {
    // Use a never-resolving fetch to freeze state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('updates stat pills after fetch resolves', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders the stat labels', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(screen.getByText('Apiaries')).toBeInTheDocument();
    expect(screen.getByText('Hives')).toBeInTheDocument();
    expect(screen.getByText('Inspections')).toBeInTheDocument();
  });

  it('renders the map div', async () => {
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    expect(document.querySelector('#map')).toBeTruthy();
  });

  it('adds a layers control when heatmap features are present', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(ok(STATS))
      .mockResolvedValueOnce(ok(HEATMAP_WITH_DATA)),
    );
    const L = (await import('leaflet')).default;
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(L.control.layers).toHaveBeenCalled());
  });

  it('does not add a layers control when heatmap has no features', async () => {
    const L = (await import('leaflet')).default;
    vi.mocked(L.control.layers).mockClear();
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => screen.getByText('5'));
    expect(L.control.layers).not.toHaveBeenCalled();
  });

  it('adds markers for apiaries with coordinates', async () => {
    const statsWithApiary = {
      ...STATS,
      apiaries: [{ id: 'a-1', name: 'Garden', latitude: 48.5, longitude: 9.5, hive_count: 3 }],
    };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(ok(statsWithApiary))
      .mockResolvedValueOnce(ok(HEATMAP_EMPTY)),
    );
    const L = (await import('leaflet')).default;
    vi.mocked(L.marker).mockClear();
    const { default: MapClient } = await import('@/components/MapClient');
    render(<MapClient labels={labels} />);
    await waitFor(() => expect(L.marker).toHaveBeenCalledWith([48.5, 9.5], expect.anything()));
  });
});
