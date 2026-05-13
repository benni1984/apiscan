'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Apiary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hive_count: number;
}
interface StatsData {
  apiary_count: number;
  hive_count: number;
  inspection_count: number;
  apiaries: Apiary[];
}
interface HeatmapData {
  type: string;
  features: {
    type: string;
    geometry: { type: string; coordinates: number[][][] };
    properties: { avg_varroa: number; apiary_count: number; inspection_count: number };
  }[];
}

function varroaColor(avg: number): string {
  if (avg < 2) return '#22c55e';
  if (avg < 5) return '#f59e0b';
  return '#ef4444';
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Labels {
  apiaries: string;
  hives: string;
  inspections: string;
  hiveSingular: string;
  hivePlural: string;
  viewDetails: string;
  heatmapToggle: string;
  heatmapLow: string;
  heatmapMedium: string;
  heatmapHigh: string;
}

export default function MapClient({ labels }: { labels: Labels }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ apiaries: '—', hives: '—', inspections: '—' });
  const [hasHeatmap, setHasHeatmap] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    let destroyed = false;
    import('leaflet').then(L => {
      if (destroyed || !mapRef.current) return;

      const map = L.default.map(mapRef.current).setView([48, 10], 4);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const hiveIcon = L.default.divIcon({
        className: '',
        html: `<div style="background:#14532d;border:3px solid #f59e0b;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;">🐝</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      Promise.all([
        fetch('/api/v1/public/stats').then(r => r.json()),
        fetch('/api/v1/public/heatmap').then(r => r.json()),
      ]).then(([data, heatmap]: [StatsData, HeatmapData]) => {
        if (destroyed) return;

        setStats({
          apiaries: data.apiary_count.toLocaleString(),
          hives: data.hive_count.toLocaleString(),
          inspections: data.inspection_count.toLocaleString(),
        });

        if (data.apiaries?.length) {
          const bounds: [number, number][] = [];
          data.apiaries.forEach(a => {
            bounds.push([a.latitude, a.longitude]);
            const marker = L.default.marker([a.latitude, a.longitude], { icon: hiveIcon }).addTo(map);
            marker.bindPopup(
              `<div class="map-popup"><h3>${esc(a.name)}</h3><p>🐝 ${a.hive_count} ${a.hive_count !== 1 ? labels.hivePlural : labels.hiveSingular}</p><a href="/apiary?id=${a.id}">${labels.viewDetails}</a></div>`,
              { maxWidth: 220 }
            );
          });
          if (bounds.length === 1) map.setView(bounds[0], 12);
          else map.fitBounds(bounds, { padding: [40, 40] });
        }

        if (heatmap.features?.length) {
          const heatmapLayer = L.default.geoJSON(heatmap as any, {
            style: feature => ({
              fillColor: varroaColor(feature?.properties.avg_varroa ?? 0),
              fillOpacity: 0.5,
              color: '#fff',
              weight: 1,
            }),
            onEachFeature: (feature, layer) => {
              const p = feature.properties;
              layer.bindPopup(
                `<div class="map-popup"><h3>🪲 Varroa: ${p.avg_varroa}</h3><p>${p.apiary_count} apiar${p.apiary_count !== 1 ? 'ies' : 'y'} · ${p.inspection_count} inspection${p.inspection_count !== 1 ? 's' : ''}</p></div>`,
                { maxWidth: 200 }
              );
            },
          });

          L.default.control.layers(
            {},
            { [labels.heatmapToggle]: heatmapLayer },
            { collapsed: false, position: 'topright' }
          ).addTo(map);

          // Legend control
          const legend = new L.default.Control({ position: 'bottomleft' });
          legend.onAdd = () => {
            const div = L.default.DomUtil.create('div', 'map-heatmap-legend');
            div.innerHTML =
              `<div class="legend-row"><span class="legend-dot" style="background:#22c55e"></span>${labels.heatmapLow}</div>` +
              `<div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span>${labels.heatmapMedium}</div>` +
              `<div class="legend-row"><span class="legend-dot" style="background:#ef4444"></span>${labels.heatmapHigh}</div>`;
            return div;
          };
          legend.addTo(map);

          setHasHeatmap(true);
        }
      }).catch(() => {});

      return () => { destroyed = true; map.remove(); };
    });

    return () => { destroyed = true; };
  }, []);

  return (
    <>
      <div className="map-stats-bar">
        <div className="map-stat-pill"><span className="num">{stats.apiaries}</span><span className="label">{labels.apiaries}</span></div>
        <div className="map-stat-pill"><span className="num">{stats.hives}</span><span className="label">{labels.hives}</span></div>
        <div className="map-stat-pill"><span className="num">{stats.inspections}</span><span className="label">{labels.inspections}</span></div>
      </div>
      <div id="map" ref={mapRef} />
    </>
  );
}
