'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { getHornetNests } from '@/lib/api';
import type { HornetNestGeoJSON } from '@/lib/api';

const HornetMapClient = dynamic(() => import('@/components/HornetMapClient'), { ssr: false });

export default function HornetMapPage() {
  const t = useTranslations('hornets');
  const [geojson, setGeojson] = useState<HornetNestGeoJSON>({ type: 'FeatureCollection', features: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHornetNests()
      .then(setGeojson)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const labels = {
    statusFound: t('map.status.found'),
    statusOrdered: t('map.status.ordered'),
    statusDestroyed: t('map.status.destroyed'),
    legendTitle: t('map.legend'),
    noNests: t('map.noNests'),
  };

  return (
    <main className="hornets-map-page">
      <div className="hornets-map-header">
        <h1>{t('map.title')}</h1>
        <p>{t('map.subtitle')}</p>
        <div className="hornets-map-legend-inline">
          <span className="legend-dot" style={{ background: '#ef4444' }} />{t('map.status.found')}
          <span className="legend-dot" style={{ background: '#f59e0b', marginLeft: '1rem' }} />{t('map.status.ordered')}
          <span className="legend-dot" style={{ background: '#22c55e', marginLeft: '1rem' }} />{t('map.status.destroyed')}
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : geojson.features.length === 0 ? (
        <p className="dash-empty">{t('map.noNests')}</p>
      ) : (
        <HornetMapClient geojson={geojson} labels={labels} />
      )}
    </main>
  );
}
