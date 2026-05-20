'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { CommunityHeatmap, CommunityHeatmapProperties } from '@/lib/api';

type Overlay = 'varroa' | 'mood' | 'swarm' | 'brood';

const OVERLAYS: { key: Overlay; label: string }[] = [
  { key: 'varroa', label: 'Varroa Risk' },
  { key: 'mood', label: 'Colony Mood' },
  { key: 'swarm', label: 'Swarm Pressure' },
  { key: 'brood', label: 'Brood Health' },
];

const LEGEND: Record<Overlay, { color: string; label: string }[]> = {
  varroa: [
    { color: '#22c55e', label: 'Low (< 2)' },
    { color: '#f59e0b', label: 'Medium (2–5)' },
    { color: '#ef4444', label: 'High (> 5)' },
    { color: '#9ca3af', label: 'No data' },
  ],
  mood: [
    { color: '#22c55e', label: 'Good (≥ 70% calm)' },
    { color: '#f59e0b', label: 'Fair (40–70%)' },
    { color: '#ef4444', label: 'Low (< 40%)' },
    { color: '#9ca3af', label: 'No data' },
  ],
  swarm: [
    { color: '#22c55e', label: 'Low (< 10%)' },
    { color: '#f59e0b', label: 'Medium (10–30%)' },
    { color: '#ef4444', label: 'High (> 30%)' },
  ],
  brood: [
    { color: '#16a34a', label: 'Strong (≥ 5 frames)' },
    { color: '#f59e0b', label: 'Fair (3–5)' },
    { color: '#ef4444', label: 'Low (< 3)' },
    { color: '#9ca3af', label: 'No data' },
  ],
};

function cellColor(props: CommunityHeatmapProperties, ov: Overlay): string {
  switch (ov) {
    case 'varroa': {
      const v = props.avg_varroa;
      if (v === null) return '#9ca3af';
      return v < 2 ? '#22c55e' : v < 5 ? '#f59e0b' : '#ef4444';
    }
    case 'mood': {
      const s = props.mood_score;
      if (s === null) return '#9ca3af';
      return s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444';
    }
    case 'swarm': {
      const p = props.swarm_pct;
      return p < 10 ? '#22c55e' : p < 30 ? '#f59e0b' : '#ef4444';
    }
    case 'brood': {
      const b = props.avg_brood;
      if (b === null) return '#9ca3af';
      return b >= 5 ? '#16a34a' : b >= 3 ? '#f59e0b' : '#ef4444';
    }
  }
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tooltipHtml(props: CommunityHeatmapProperties): string {
  const varroa = props.avg_varroa !== null ? props.avg_varroa.toFixed(1) : '—';
  const mood = props.mood_score !== null ? `${props.mood_score}%` : '—';
  const brood = props.avg_brood !== null ? props.avg_brood.toFixed(1) : '—';
  return `<div style="font-size:.82rem;line-height:1.7;min-width:140px">
<b>${esc(String(props.apiary_count))} ${props.apiary_count === 1 ? 'apiary' : 'apiaries'}</b> &middot; ${esc(String(props.inspection_count))} inspections<br>
Varroa avg: <b>${esc(varroa)}</b><br>
Calm mood: <b>${esc(mood)}</b><br>
Brood avg: <b>${esc(brood)}</b><br>
Swarm cells: <b>${esc(String(props.swarm_pct))}%</b>
</div>`;
}

export default function CommunityMap({ data }: { data: CommunityHeatmap }) {
  const [overlay, setOverlay] = useState<Overlay>('varroa');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);
  const overlayRef = useRef<Overlay>('varroa');
  overlayRef.current = overlay;

  function drawLayer(L: any) {
    if (geoLayerRef.current) {
      geoLayerRef.current.remove();
      geoLayerRef.current = null;
    }
    geoLayerRef.current = L.geoJSON(data, {
      style: (feature: any) => ({
        fillColor: cellColor(feature.properties, overlayRef.current),
        fillOpacity: 0.65,
        color: '#fff',
        weight: 0.5,
      }),
      onEachFeature: (feature: any, layer: any) => {
        layer.bindTooltip(tooltipHtml(feature.properties), { sticky: true });
      },
    }).addTo(mapRef.current);
  }

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    import('leaflet').then((m) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = m.default;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([51, 10], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 10,
      }).addTo(map);
      mapRef.current = map;
      drawLayer(L);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      geoLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((m) => {
      if (mapRef.current) drawLayer(m.default);
    });
  }, [overlay]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {OVERLAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setOverlay(key)}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: `2px solid ${overlay === key ? '#166534' : 'var(--border, #e5e7eb)'}`,
              background: overlay === key ? '#166534' : 'transparent',
              color: overlay === key ? '#fff' : 'inherit',
              cursor: 'pointer',
              fontSize: '.82rem',
              fontWeight: overlay === key ? 700 : 400,
              transition: 'background .15s, color .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{ height: 420, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border, #e5e7eb)' }}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '.75rem', color: 'var(--muted, #6b7280)' }}>
        {LEGEND[overlay].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, background: color, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
