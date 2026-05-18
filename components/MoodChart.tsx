'use client';
import { useEffect, useRef } from 'react';

interface MoodChartProps {
  distribution: Record<string, number>;
}

const MOOD_COLORS: Record<string, string> = {
  calm: '#16a34a',
  nervous: '#f59e0b',
  aggressive: '#ef4444',
};

export default function MoodChart({ distribution }: MoodChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const entries = Object.entries(distribution).filter(([, v]) => v > 0);
    if (!canvasRef.current || entries.length === 0) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      const total = entries.reduce((s, [, v]) => s + v, 0);
      chart = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
          datasets: [{
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(([k]) => MOOD_COLORS[k] ?? '#6b7280'),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                  return ` ${ctx.label}: ${pct}% (${ctx.parsed})`;
                },
              },
            },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [distribution]);

  return <canvas ref={canvasRef} />;
}
