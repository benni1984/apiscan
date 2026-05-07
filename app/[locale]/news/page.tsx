import { useTranslations } from 'next-intl';

export default function NewsPage() {
  const t = useTranslations('news');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="news-section">
        <div className="container">
          <div className="news-list">
            <article className="news-card" data-aos="fade-up">
              <div className="news-date"><div className="day">02</div><div className="month">May 2025</div></div>
              <div className="news-body">
                <span className="news-tag">Release</span>
                <h3>ApiScan v1.0 — Now Live on iOS and Android</h3>
                <p>After months of development and beta testing with a group of dedicated beekeepers, ApiScan v1.0 is officially available on the App Store and Google Play. The launch includes QR-based hive management, varroa tracking, apiary statistics, and a live public map showing our growing community.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="60">
              <div className="news-date"><div className="day">18</div><div className="month">Apr 2025</div></div>
              <div className="news-body">
                <span className="news-tag">Research</span>
                <h3>Partnership with Pollinator Health Research Network</h3>
                <p>We&apos;re excited to announce an anonymized data-sharing agreement with researchers studying the relationship between varroa mite levels and colony winter survival. Starting this spring, aggregated inspection data from ApiScan will contribute to longitudinal studies spanning multiple European and North American regions.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="120">
              <div className="news-date"><div className="day">05</div><div className="month">Apr 2025</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Custom Inspection Fields — Log What Matters to You</h3>
                <p>Every beekeeper tracks different things. v0.9.5 introduced custom field definitions — add your own inspection data points at the apiary or per-hive level. The backend now supports arbitrary text, number, boolean, date, and select-type fields.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="180">
              <div className="news-date"><div className="day">12</div><div className="month">Mar 2025</div></div>
              <div className="news-body">
                <span className="news-tag">Community</span>
                <h3>500 Apiaries Registered — A Milestone Worth Celebrating</h3>
                <p>The ApiScan community has crossed 500 registered apiaries spanning four continents. What started as a personal project for a small group of local beekeepers has grown into a genuine global network.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="240">
              <div className="news-date"><div className="day">20</div><div className="month">Feb 2025</div></div>
              <div className="news-body">
                <span className="news-tag">Open Source</span>
                <h3>ApiScan Goes Open Source</h3>
                <p>The full ApiScan codebase — backend API, iOS app, and Android app — is now publicly available on GitHub under the MIT License. Pull requests, issues, and feature discussions are open to everyone.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
