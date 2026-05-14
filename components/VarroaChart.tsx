'use client';
import { useEffect, useRef } from 'react';

interface Point { date: string; value: number; }

export default function VarroaChart({ data }: { data: Point[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      chart = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: data.map(p => p.date),
          datasets: [{
            data: data.map(p => p.value),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#ef4444',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { maxRotation: 45, maxTicksLimit: 12 } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data]);

  return <canvas ref={canvasRef} />;
}
