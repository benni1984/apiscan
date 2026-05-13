'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false });

export default function MapPage() {
  const t = useTranslations('map');
  return (
    <MapClient labels={{
      apiaries: t('stat.apiaries'),
      hives: t('stat.hives'),
      inspections: t('stat.inspections'),
      hiveSingular: t('popup.hiveSingular'),
      hivePlural: t('popup.hivePlural'),
      viewDetails: t('popup.viewDetails'),
      heatmapToggle: t('heatmap.toggle'),
      heatmapLow: t('heatmap.low'),
      heatmapMedium: t('heatmap.medium'),
      heatmapHigh: t('heatmap.high'),
    }} />
  );
}
