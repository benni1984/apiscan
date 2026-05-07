import { Suspense } from 'react';
import Link from 'next/link';
import ApiaryDetailClient from '@/components/ApiaryDetailClient';

export default function ApiaryPage() {
  return (
    <>
      <header>
        <Link className="back-btn" href="/map">← Map</Link>
        <Link className="logo" href="/">🐝 Api<span>Scan</span></Link>
        <span className="subtitle">Apiary detail</span>
      </header>
      <div className="page-body">
        <div id="content">
          <Suspense fallback={<div className="spinner" />}>
            <ApiaryDetailClient />
          </Suspense>
        </div>
      </div>
    </>
  );
}
