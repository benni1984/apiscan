import { useTranslations } from 'next-intl';
import MembersStats from '@/components/MembersStats';

export default function MembersPage() {
  const t = useTranslations('members');
  const tp = useTranslations('price');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="members-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>{t('snap.title')}</h2>
            <p>{t('snap.sub')}</p>
          </div>
          <MembersStats />

          <div className="members-teaser" data-aos="fade-up">
            <div className="members-teaser-header">
              <i className="fas fa-chart-bar" />
              <div>
                <h3>{t('teaser.title')}</h3>
                <p>{t('teaser.sub')}</p>
              </div>
            </div>
            <div className="members-preview">
              <div className="members-preview-grid">
                <div className="members-preview-stat"><div className="num">3.2</div><div className="label">Avg Varroa (global)</div></div>
                <div className="members-preview-stat"><div className="num">78%</div><div className="label">Hives: Good Mood</div></div>
                <div className="members-preview-stat"><div className="num">6.4</div><div className="label">Avg Brood Frames</div></div>
                <div className="members-preview-stat"><div className="num">12d</div><div className="label">Avg Inspection Interval</div></div>
              </div>
              <div style={{height:'120px',background:'linear-gradient(90deg,#dcfce7,#fef3c7,#dcfce7)',borderRadius:'12px',opacity:.5,marginTop:'16px'}} />
            </div>
            <div className="members-gate">
              <h3>{t('gate.title')}</h3>
              <p>{t('gate.desc')}</p>
              <a href="/#download" className="btn-primary" style={{display:'inline-block',marginBottom:'8px'}}>{t('gate.cta')}</a>
              <p style={{fontSize:'.82rem',color:'var(--muted)',marginTop:'12px'}}>{t('gate.note')}</p>
            </div>
          </div>

          <div className="section-header" data-aos="fade-up" style={{marginTop:'80px'}}>
            <h2>{t('benefits.title')}</h2>
            <p>{t('benefits.sub')}</p>
          </div>
          <div className="members-benefits" data-aos="fade-up" data-aos-delay="60">
            {(['b1','b2','b3','b4','b5','b6'] as const).map((k, i) => {
              const icons = ['fa-globe','fa-chart-area','fa-download','fa-map','fa-microscope','fa-star'];
              const coming = i >= 2 && i <= 3;
              return (
                <div key={k} className="benefit-card">
                  <i className={`fas ${icons[i]}`} />
                  <h4>{t(`${k}.title`)}</h4>
                  <p>{t(`${k}.desc`)}{coming && <> <span className="coming-soon-badge">{tp('coming')}</span></>}</p>
                </div>
              );
            })}
          </div>

          <div style={{marginTop:'64px',background:'linear-gradient(135deg,var(--green) 0%,var(--green-mid) 100%)',borderRadius:'20px',padding:'48px',textAlign:'center',color:'#fff'}} data-aos="fade-up">
            <div className="section-tag light" style={{marginBottom:'16px'}}>{t('coming.tag')}</div>
            <h2 style={{fontSize:'1.7rem',fontWeight:800,marginBottom:'12px'}}>{t('coming.title')}</h2>
            <p style={{color:'rgba(255,255,255,.8)',maxWidth:'520px',margin:'0 auto 28px',fontSize:'1rem',lineHeight:1.65}}>{t('coming.desc')}</p>
            <a href="https://github.com/benni1984/apiscan" className="btn-github" target="_blank" rel="noopener">
              <i className="fab fa-github" /> {t('coming.btn')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
