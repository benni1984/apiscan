import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHornetStats,
  submitHornetCatch,
  getHornetNests,
  submitHornetNest,
  getHornetSightings,
  submitHornetSighting,
  voteOnSighting,
} from '@/lib/api';

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockStats = {
  total_caught: 142,
  total_nests: 17,
  destroyed_nests: 5,
  pending_sightings: 3,
  confirmed_sightings: 9,
};

const mockGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: {
        id: 'n1',
        status: 'found',
        reporter_name: null,
        notes: null,
        photo_url: null,
        created_at: '2026-05-01T10:00:00',
      },
    },
  ],
};

const mockSighting = {
  id: 's1',
  photo_url: 'https://blob.example.com/s1.jpg',
  description: 'Near flowers',
  reporter_name: 'Alice',
  latitude: 48.85,
  longitude: 2.35,
  status: 'pending',
  yes_votes: 0,
  no_votes: 0,
  created_at: '2026-05-01T10:00:00',
};

const mockPaginated = {
  items: [mockSighting],
  total: 1,
  page: 1,
  per_page: 12,
  pages: 1,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Stats ──────────────────────────────────────────────────────────────────────

describe('getHornetStats', () => {
  it('returns stats object on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockStats));
    const stats = await getHornetStats();
    expect(stats).toEqual(mockStats);
  });

  it('calls correct endpoint without auth header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockStats));
    await getHornetStats();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/stats');
    expect((init?.headers as Record<string, string>)?.['Authorization']).toBeUndefined();
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetStats()).rejects.toThrow();
  });
});

// ── Catches ────────────────────────────────────────────────────────────────────

describe('submitHornetCatch', () => {
  it('posts catch data to /hornets/catches', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'c1', count: 3 }, 201));
    await submitHornetCatch({ count: 3, latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/catches');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.count).toBe(3);
    expect(body.latitude).toBe(48.85);
  });

  it('resolves without error on 201', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ id: 'c1', count: 1 }, 201));
    await expect(submitHornetCatch({ count: 1 })).resolves.toBeUndefined();
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(submitHornetCatch({ count: 0 })).rejects.toThrow();
  });
});

// ── Nests ──────────────────────────────────────────────────────────────────────

describe('getHornetNests', () => {
  it('returns GeoJSON FeatureCollection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockGeoJSON));
    const nests = await getHornetNests();
    expect(nests.type).toBe('FeatureCollection');
    expect(nests.features).toHaveLength(1);
    expect(nests.features[0].geometry.type).toBe('Point');
  });

  it('calls /hornets/nests without auth', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockGeoJSON));
    await getHornetNests();
    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/nests');
  });

  it('throws on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetNests()).rejects.toThrow();
  });
});

describe('submitHornetNest', () => {
  it('posts nest data with required lat/lon', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 201));
    await submitHornetNest({ latitude: 48.85, longitude: 2.35 });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/nests');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.latitude).toBe(48.85);
    expect(body.longitude).toBe(2.35);
  });

  it('includes optional fields when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 201));
    await submitHornetNest({
      latitude: 48.85,
      longitude: 2.35,
      notes: 'Under eaves',
      photo_url: 'https://blob.example.com/nest.jpg',
    });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.notes).toBe('Under eaves');
    expect(body.photo_url).toBe('https://blob.example.com/nest.jpg');
  });
});

// ── Sightings ──────────────────────────────────────────────────────────────────

describe('getHornetSightings', () => {
  it('returns paginated sightings', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockPaginated));
    const result = await getHornetSightings(1);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('pending');
  });

  it('passes page param', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockPaginated));
    await getHornetSightings(3);
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toMatch('page=3');
  });

  it('throws on error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 500));
    await expect(getHornetSightings()).rejects.toThrow();
  });
});

describe('submitHornetSighting', () => {
  it('posts sighting with photo_url', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok(mockSighting, 201));
    await submitHornetSighting({ photo_url: 'https://blob.example.com/s1.jpg' });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/sightings');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.photo_url).toBe('https://blob.example.com/s1.jpg');
  });

  it('throws on server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({}, 422));
    await expect(submitHornetSighting({ photo_url: '' })).rejects.toThrow();
  });
});

// ── Voting ─────────────────────────────────────────────────────────────────────

describe('voteOnSighting', () => {
  it('posts yes vote to correct endpoint', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await voteOnSighting('s1', 'yes');
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch('/hornets/sightings/s1/vote');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.vote).toBe('yes');
  });

  it('posts no vote', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await voteOnSighting('s2', 'no');
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.vote).toBe('no');
  });

  it('throws on non-204 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ error: 'not found' }, 404));
    await expect(voteOnSighting('bad-id', 'yes')).rejects.toThrow();
  });

  it('resolves without error on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(voteOnSighting('s1', 'yes')).resolves.toBeUndefined();
  });
});
