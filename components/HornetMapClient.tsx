'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { HornetNestGeoJSON, HornetNestFeature } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  found: '#ef4444',              // red
  destruction_ordered: '#f59e0b', // amber
  destroyed: '#22c55e',           // green
};

function nestIcon(L: typeof import('leaflet'), status: string) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};border:3px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;">🐝</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface Labels {
  statusFound: string;
  statusOrdered: string;
  statusDestroyed: string;
  legendTitle: string;
  noNests: string;
}

interface Props {
  geojson: HornetNestGeoJSON;
  labels: Labels;
}

export default function HornetMapClient({ geojson, labels }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;

    import('leaflet').then(Lmod => {
      const L = Lmod.default ?? Lmod;
      if (destroyed || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([48, 10], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const statusLabel: Record<string, string> = {
        found: labels.statusFound,
        destruction_ordered: labels.statusOrdered,
        destroyed: labels.statusDestroyed,
      };

      const bounds: [number, number][] = [];

      geojson.features.forEach((feature: HornetNestFeature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const p = feature.properties;
        bounds.push([lat, lng]);
        const marker = L.marker([lat, lng], { icon: nestIcon(L, p.status) }).addTo(map);
        marker.bindPopup(
          `<div class="map-popup">
            <p style="margin:0 0 4px;font-weight:600">${statusLabel[p.status] ?? p.status}</p>
            ${p.notes ? `<p style="margin:0 0 4px;font-size:.85rem">${esc(p.notes)}</p>` : ''}
            ${p.photo_url ? `<img src="${esc(p.photo_url)}" alt="" style="width:100%;border-radius:4px;margin-top:4px;max-height:120px;object-fit:cover"/>` : ''}
          </div>`,
          { maxWidth: 220 },
        );
      });

      if (bounds.length === 1) map.setView(bounds[0], 12);
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });

      // Legend
      const legend = new L.Control({ position: 'bottomleft' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'map-heatmap-legend');
        div.innerHTML =
          `<strong style="display:block;margin-bottom:4px">${esc(labels.legendTitle)}</strong>` +
          Object.entries(STATUS_COLORS).map(([k, c]) =>
            `<div class="legend-row"><span class="legend-dot" style="background:${c}"></span>${esc(statusLabel[k] ?? k)}</div>`
          ).join('');
        return div;
      };
      legend.addTo(map);

      return () => { destroyed = true; map.remove(); };
    });

    return () => { destroyed = true; };
  }, [geojson, labels]);

  return (
    <div
      id="hornet-map"
      ref={mapRef}
      style={{ height: '520px', width: '100%', borderRadius: '12px' }}
    />
  );
}
