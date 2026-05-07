'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function MembersStats() {
  const t = useTranslations('stats');
  const [apiaries, setApiaries] = useState('—');
  const [hives, setHives] = useState('—');
  const [inspections, setInspections] = useState('—');

  useEffect(() => {
    fetch('/api/v1/public/stats')
      .then(r => r.json())
      .then((data: { apiary_count: number; hive_count: number; inspection_count: number }) => {
        setApiaries(data.apiary_count.toLocaleString());
        setHives(data.hive_count.toLocaleString());
        setInspections(data.inspection_count.toLocaleString());
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'20px',marginBottom:'64px'}} data-aos="fade-up" data-aos-delay="60">
      <div className="stat-box"><div className="num">{apiaries}</div><div className="label">{t('apiaries')}</div></div>
      <div className="stat-box"><div className="num">{hives}</div><div className="label">{t('hives')}</div></div>
      <div className="stat-box"><div className="num">{inspections}</div><div className="label">{t('inspections')}</div></div>
    </div>
  );
}
