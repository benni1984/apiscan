'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LiveStats = dynamic(() => import('@/components/LiveStats'), { ssr: false });

export default function HomePage() {
  const t = useTranslations();
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge" data-aos="fade-down">{t('hero.badge')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">
            <span>{t('hero.title1')}</span><br />
            <span className="hero-highlight">{t('hero.title2')}</span>
          </h1>
          <p className="hero-sub" data-aos="fade-up" data-aos-delay="160">{t('hero.subtitle')}</p>
          <div className="hero-actions" data-aos="fade-up" data-aos-delay="240">
            <a href="#download" className="btn-store btn-apple" data-umami-event="hero_store_ios">
              <i className="fab fa-apple" />
              <span><small>{t('hero.apple.pre')}</small><span>{t('hero.apple.store')}</span></span>
            </a>
            <a href="#download" className="btn-store btn-android" data-umami-event="hero_store_android">
              <i className="fab fa-google-play" />
              <span><small>{t('hero.google.pre')}</small><span>{t('hero.google.play')}</span></span>
            </a>
          </div>
          <div className="hero-scroll-hint" data-aos="fade-up" data-aos-delay="400">
            <span>{t('hero.scroll')}</span>
            <i className="fas fa-chevron-down bounce" />
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-intro" data-aos="fade-up">
            <h2>{t('stats.title')}</h2>
            <p>{t('stats.sub')}</p>
          </div>
          <LiveStats labels={{ apiaries: t('stats.apiaries'), hives: t('stats.hives'), inspections: t('stats.inspections'), countries: t('stats.countries') }} />
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <div className="section-tag">{t('feat.tag')}</div>
            <h2>{t('feat.title')}</h2>
            <p>{t('feat.sub')}</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '📱', key: 'qr', delay: 0 },
              { icon: '📊', key: 'track', delay: 80 },
              { icon: '🌍', key: 'global', delay: 160 },
              { icon: '📈', key: 'trends', delay: 240 },
              { icon: '🖨️', key: 'batch', delay: 320 },
              { icon: '🔒', key: 'privacy', delay: 400 },
            ].map(({ icon, key, delay }) => (
              <div key={key} className="feature-card" data-aos="fade-up" data-aos-delay={delay}>
                <span className="feature-icon">{icon}</span>
                <h3>{t(`feat.${key}.title` as never)}</h3>
                <p>{t(`feat.${key}.desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-content">
            <div className="mission-text" data-aos="fade-right">
              <div className="section-tag light">{t('mission.tag')}</div>
              <h2>{t('mission.title')}</h2>
              <p>{t('mission.p1')}</p>
              <ul className="mission-list">
                {(['li1','li2','li3','li4'] as const).map(k => (
                  <li key={k}><i className="fas fa-check-circle" /> <span>{t(`mission.${k}`)}</span></li>
                ))}
              </ul>
              <p className="mission-callout">{t('mission.callout')}</p>
            </div>
            <div className="mission-visual" data-aos="fade-left" data-aos-delay="80">
              <div className="hex-stat"><div className="hex-num">75%</div><div className="hex-label">{t('hex1.label')}</div></div>
              <div className="hex-stat amber"><div className="hex-num">40%</div><div className="hex-label">{t('hex2.label')}</div></div>
              <div className="hex-stat"><div className="hex-num">$577B</div><div className="hex-label">{t('hex3.label')}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="community-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <div className="section-tag">{t('comm.tag')}</div>
            <h2>{t('comm.title')}</h2>
            <p>{t('comm.sub')}</p>
          </div>
          <div className="community-grid" data-aos="fade-up" data-aos-delay="80">
            <div className="community-card accent-green"><i className="fas fa-map-marked-alt" /><h3>{t('comm.disease.title')}</h3><p>{t('comm.disease.desc')}</p></div>
            <div className="community-card accent-amber"><i className="fas fa-chart-line" /><h3>{t('comm.seasonal.title')}</h3><p>{t('comm.seasonal.desc')}</p></div>
            <div className="community-card accent-green"><i className="fas fa-university" /><h3>{t('comm.research.title')}</h3><p>{t('comm.research.desc')}</p></div>
            <div className="community-card accent-amber"><i className="fas fa-seedling" /><h3>{t('comm.policy.title')}</h3><p>{t('comm.policy.desc')}</p></div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="roadmap-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <div className="section-tag">{t('road.tag')}</div>
            <h2>{t('road.title')}</h2>
            <p>{t('road.sub')}</p>
          </div>
          <div className="roadmap-grid" data-aos="fade-up" data-aos-delay="60">
            <div className="roadmap-card"><span className="roadmap-status planned">{t('road.label.planned')}</span><h3>{t('road.remind.title')}</h3><p>{t('road.remind.desc')}</p></div>
            <div className="roadmap-card"><span className="roadmap-status planned">{t('road.label.planned')}</span><h3>{t('road.export.title')}</h3><p>{t('road.export.desc')}</p></div>
            <div className="roadmap-card"><span className="roadmap-status progress">{t('road.label.progress')}</span><h3>{t('road.fields.title')}</h3><p>{t('road.fields.desc')}</p></div>
            <div className="roadmap-card"><span className="roadmap-status planned">{t('road.label.planned')}</span><h3>{t('road.heat.title')}</h3><p>{t('road.heat.desc')}</p></div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="support-section" id="support">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <div className="section-tag">{t('support.tag')}</div>
            <h2>{t('support.title')}</h2>
            <p>{t('support.sub')}</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card" data-aos="fade-up" data-aos-delay="0">
              <div className="pricing-tier">{t('price.free.tier')}</div>
              <div className="pricing-price">€0 <span>{t('price.month')}</span></div>
              <ul className="pricing-features">
                {(['f1','f2','f3','f4','f5'] as const).map(k => <li key={k}><i className="fas fa-check" /> <span>{t(`price.free.${k}`)}</span></li>)}
                {(['f6','f7','f8'] as const).map(k => <li key={k} className="dim"><i className="fas fa-times" /> <span>{t(`price.free.${k}`)}</span></li>)}
              </ul>
              <a href="#download" className="btn-outline">{t('btn.free')}</a>
            </div>
            <div className="pricing-card featured" data-aos="fade-up" data-aos-delay="100">
              <div className="pricing-badge">{t('price.sup.badge')}</div>
              <div className="pricing-tier">{t('price.sup.tier')}</div>
              <div className="pricing-price">€2.99 <span>{t('price.month')}</span></div>
              <ul className="pricing-features">
                {(['f1','f2','f3','f4','f5','f6'] as const).map(k => <li key={k}><i className="fas fa-check" /> <span>{t(`price.sup.${k}`)}</span></li>)}
                <li><i className="fas fa-check" /> <span>{t('price.sup.f7')}</span> <span className="coming-soon-badge">{t('price.coming')}</span></li>
                <li><i className="fas fa-check" /> <span>{t('price.sup.f8')}</span> <span className="coming-soon-badge">{t('price.coming')}</span></li>
              </ul>
              <a href="#download" className="btn-primary" data-umami-event="pricing_supporter_cta">{t('btn.supporter')}</a>
            </div>
            <div className="pricing-card" data-aos="fade-up" data-aos-delay="200">
              <div className="pricing-tier">{t('price.donate.tier')}</div>
              <div className="pricing-price">{t('price.donate.price')}</div>
              <p className="pricing-note">{t('price.donate.note')}</p>
              <div className="donation-buttons">
                <a href="https://ko-fi.com/benjaminmuller64800" className="btn-donate btn-kofi" target="_blank" rel="noopener noreferrer" data-umami-event="donate_kofi"><i className="fas fa-coffee" /> {t('btn.kofi')}</a>
                <a href="https://www.paypal.com/donate/?hosted_button_id=H583STJ96AXT2" className="btn-donate btn-paypal" target="_blank" rel="noopener noreferrer" data-umami-event="donate_paypal"><i className="fab fa-paypal" /> {t('btn.paypal')}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="download-section" id="download">
        <div className="container">
          <div className="download-content" data-aos="fade-up">
            <div className="section-tag light">{t('dl.tag')}</div>
            <h2>{t('dl.title')}</h2>
            <p>{t('dl.sub')}</p>
            <div className="download-badges">
              <a href="#" className="store-badge apple-badge" aria-label="Download on the App Store" data-umami-event="download_ios">
                <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height={52} />
              </a>
              <a href="#" className="store-badge google-badge" aria-label="Get it on Google Play" data-umami-event="download_android">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" height={52} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="map-preview-section">
        <div className="container">
          <div className="map-preview-content" data-aos="fade-up">
            <h2>{t('map.preview.title')}</h2>
            <p>{t('map.preview.sub')}</p>
            <Link href="/map" className="btn-outline-dark">{t('map.preview.btn')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
