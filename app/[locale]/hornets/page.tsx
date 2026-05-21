import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getHornetStats } from '@/lib/api';
import type { HornetStats } from '@/lib/api';

export default async function HornetsPage() {
  const t = await getTranslations('hornets');

  let stats: HornetStats | null = null;
  try {
    stats = await getHornetStats();
  } catch {}

  return (
    <main className="hornets-page">
      {/* Hero */}
      <section className="hornets-hero">
        <div className="hornets-hero-inner">
          <span className="hornets-tag">{t('tag')}</span>
          <h1>{t('title')}</h1>
          <p className="hornets-subtitle">{t('subtitle')}</p>
          <div className="hornets-ctas">
            <Link href="/hornets/report" className="btn-primary">{t('report.catchTab')}</Link>
            <Link href="/hornets/map" className="btn-outline">{t('map.title')}</Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <section className="hornets-stats">
          <div className="hornets-stats-grid">
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.total_caught.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.caught')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.total_nests.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.nests')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.destroyed_nests.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.destroyed')}</span>
            </div>
            <div className="hornets-stat-card">
              <span className="hornets-stat-num">{stats.confirmed_sightings.toLocaleString()}</span>
              <span className="hornets-stat-label">{t('stats.sightings')}</span>
            </div>
          </div>
        </section>
      )}

      {/* Info sections */}
      <section className="hornets-info">
        <div className="hornets-info-grid">
          <div className="hornets-info-card">
            <div className="hornets-info-icon">⚠️</div>
            <h2>{t('info.problem')}</h2>
            <p>{t('info.problemText')}</p>
          </div>
          <div className="hornets-info-card">
            <div className="hornets-info-icon">🪤</div>
            <h2>{t('info.whyCatch')}</h2>
            <p>{t('info.whyCatchText')}</p>
          </div>
          <div className="hornets-info-card">
            <div className="hornets-info-icon">📍</div>
            <h2>{t('info.reportNest')}</h2>
            <p>{t('info.reportNestText')}</p>
          </div>
        </div>
      </section>

      {/* Species reference image (CC-BY Wikimedia) */}
      <section className="hornets-species">
        <figure className="hornets-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Vespa_velutina_nigrithorax_02.jpg/640px-Vespa_velutina_nigrithorax_02.jpg"
            alt="Vespa velutina — Asian hornet"
            className="hornets-species-img"
          />
          <figcaption>
            <em>Vespa velutina</em> — CC-BY Wikimedia Commons
          </figcaption>
        </figure>
      </section>

      {/* CTAs */}
      <section className="hornets-actions">
        <div className="hornets-actions-grid">
          <Link href="/hornets/report" className="hornets-action-card">
            <span className="hornets-action-icon">📋</span>
            <strong>{t('report.catchTab')}</strong>
            <span>{t('report.catchHint')}</span>
          </Link>
          <Link href="/hornets/map" className="hornets-action-card">
            <span className="hornets-action-icon">🗺️</span>
            <strong>{t('map.title')}</strong>
            <span>{t('map.hint')}</span>
          </Link>
          <Link href="/hornets/community" className="hornets-action-card">
            <span className="hornets-action-icon">📷</span>
            <strong>{t('community.title')}</strong>
            <span>{t('community.hint')}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
