'use client';

import { useEffect, useState } from 'react';

interface Stats {
  apiary_count: number;
  hive_count: number;
  inspection_count: number;
}

function animateCount(setter: (v: string) => void, target: number) {
  const dur = 1600;
  const start = performance.now();
  function step(now: number) {
    const e = 1 - Math.pow(1 - Math.min((now - start) / dur, 1), 3);
    setter(Math.round(target * e).toLocaleString());
    if (e < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function LiveStats({ labels }: { labels: { apiaries: string; hives: string; inspections: string } }) {
  const [apiaries, setApiaries] = useState('—');
  const [hives, setHives] = useState('—');
  const [inspections, setInspections] = useState('—');

  useEffect(() => {
    fetch('/api/v1/public/stats')
      .then(r => r.json())
      .then((data: Stats) => {
        animateCount(setApiaries, data.apiary_count);
        animateCount(setHives, data.hive_count);
        animateCount(setInspections, data.inspection_count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="live-stats" data-aos="fade-up" data-aos-delay="80">
      <div className="live-stat"><div className="live-num">{apiaries}</div><div className="live-label">{labels.apiaries}</div></div>
      <div className="live-stat"><div className="live-num">{hives}</div><div className="live-label">{labels.hives}</div></div>
      <div className="live-stat"><div className="live-num">{inspections}</div><div className="live-label">{labels.inspections}</div></div>
      <div className="live-stat"><div className="live-num">42+</div><div className="live-label">Countries Reached</div></div>
    </div>
  );
}
