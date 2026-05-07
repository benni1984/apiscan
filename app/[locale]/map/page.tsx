'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false });

export default function MapPage() {
  const t = useTranslations('map.stat');
  return (
    <MapClient labels={{ apiaries: t('apiaries'), hives: t('hives'), inspections: t('inspections') }} />
  );
}
