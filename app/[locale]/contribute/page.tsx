import { useTranslations } from 'next-intl';
import FeatureForm from '@/components/FeatureForm';

export default function ContributePage() {
  const t = useTranslations('contrib');
  const tf = useTranslations('fr');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="contribute-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>{t('ways.title')}</h2>
            <p>{t('ways.sub')}</p>
          </div>
          <div className="contribute-grid" data-aos="fade-up" data-aos-delay="60">
            <div className="contribute-card">
              <i className="fas fa-bug" />
              <h3>{t('bug.title')}</h3>
              <p>{t('bug.desc')}</p>
              <a href="https://github.com/benni1984/apiscan/issues/new" className="card-link" target="_blank" rel="noopener">{t('bug.link')}</a>
            </div>
            <div className="contribute-card">
              <i className="fas fa-code-branch" />
              <h3>{t('code.title')}</h3>
              <p>{t('code.desc')}</p>
              <a href="https://github.com/benni1984/apiscan" className="card-link" target="_blank" rel="noopener">{t('code.link')}</a>
            </div>
            <div className="contribute-card">
              <i className="fas fa-book" />
              <h3>{t('docs.title')}</h3>
              <p>{t('docs.desc')}</p>
              <a href="https://github.com/benni1984/apiscan/tree/main/docs" className="card-link" target="_blank" rel="noopener">{t('docs.link')}</a>
            </div>
            <div className="contribute-card">
              <i className="fas fa-language" />
              <h3>{t('trans.title')}</h3>
              <p>{t('trans.desc')}</p>
              <a href="https://github.com/benni1984/apiscan/discussions" className="card-link" target="_blank" rel="noopener">{t('trans.link')}</a>
            </div>
            <div className="contribute-card">
              <i className="fas fa-flask" />
              <h3>{t('test.title')}</h3>
              <p>{t('test.desc')}</p>
              <a href="https://github.com/benni1984/apiscan/discussions" className="card-link" target="_blank" rel="noopener">{t('test.link')}</a>
            </div>
            <div className="contribute-card">
              <i className="fas fa-share-alt" />
              <h3>{t('spread.title')}</h3>
              <p>{t('spread.desc')}</p>
              <a href="/#download" className="card-link">{t('spread.link')}</a>
            </div>
          </div>

          <div className="github-cta" data-aos="fade-up">
            <h2>{t('github.title')}</h2>
            <p>{t('github.desc')}</p>
            <a href="https://github.com/benni1984/apiscan" className="btn-github" target="_blank" rel="noopener">
              <i className="fab fa-github" /> {t('github.btn')}
            </a>
          </div>
        </div>
      </section>

      <section className="feature-request-section" id="feature-request">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <div className="section-tag">{tf('tag')}</div>
            <h2>{tf('title')}</h2>
            <p>{tf('sub')}</p>
          </div>
          <div className="fr-form-wrap" data-aos="fade-up" data-aos-delay="60">
            <FeatureForm />
          </div>
        </div>
      </section>
    </>
  );
}
