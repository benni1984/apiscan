'use client';
import { useEffect, useRef } from 'react';

interface CityChartProps {
  data: { city: string; hives: number }[];
}

export default function CityChart({ data }: CityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      chart = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.city),
          datasets: [{
            data: data.map(d => d.hives),
            backgroundColor: '#166534',
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { ticks: { font: { size: 12 } } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data]);

  return <canvas ref={canvasRef} />;
}
