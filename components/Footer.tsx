import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="footer-logo" href="/">🐝 Api<span>Scan</span></Link>
            <p>{t('tagline')}</p>
            <div className="footer-social">
              <a href="https://github.com/benni1984/apiscan" target="_blank" rel="noopener" aria-label="GitHub">
                <i className="fab fa-github" />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <h4>{t('explore')}</h4>
            <ul>
              <li><Link href="/map">{tn('map')}</Link></li>
              <li><Link href="/members">{tn('members')}</Link></li>
              <li><Link href="/news">{tn('news')}</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('community')}</h4>
            <ul>
              <li><Link href="/contribute">{tn('contribute')}</Link></li>
              <li><a href="https://github.com/benni1984/apiscan" target="_blank" rel="noopener">GitHub</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('support')}</h4>
            <ul>
              <li><a href="https://ko-fi.com/benjaminmuller64800" target="_blank" rel="noopener" data-umami-event="footer_kofi">Ko-fi</a></li>
              <li><a href="https://www.paypal.com/donate?hosted_button_id=PLACEHOLDER" target="_blank" rel="noopener" data-umami-event="footer_paypal">PayPal</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('legal')}</h4>
            <ul>
              <li><Link href="/privacy">{t('privacy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('copyright')}</p>
          <p>{t('made')}</p>
        </div>
      </div>
    </footer>
  );
}
