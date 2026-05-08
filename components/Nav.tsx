'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_FLAGS: Record<string, string> = {
  en: '🇬🇧 EN',
  de: '🇩🇪 DE',
  fr: '🇫🇷 FR',
  es: '🇪🇸 ES',
};
const LOCALE_LABELS: Record<string, string> = {
  en: '🇬🇧 English',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
};

export default function Nav({ locale, isHome = false }: { locale: string; isHome?: boolean }) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isHome) return;
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isHome]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function switchLocale(next: string) {
    setDdOpen(false);
    router.replace(pathname, { locale: next });
  }

  const navClass = ['site-nav', !isHome && 'page-nav', isHome && scrolled && 'scrolled']
    .filter(Boolean).join(' ');

  return (
    <nav className={navClass} id="site-nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">🐝 Api<span>Scan</span></Link>

        <button
          className="nav-toggle"
          aria-label="Open menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`} id="nav-links">
          <li><Link href="/map"       onClick={() => setMenuOpen(false)}>{t('map')}</Link></li>
          <li><Link href="/news"      onClick={() => setMenuOpen(false)}>{t('news')}</Link></li>
          <li><Link href="/contribute"onClick={() => setMenuOpen(false)}>{t('contribute')}</Link></li>
          <li><Link href="/members"   onClick={() => setMenuOpen(false)}>{t('members')}</Link></li>
        </ul>

        <div className="lang-switcher" ref={ddRef}>
          <button
            className="lang-current"
            aria-label="Switch language"
            onClick={() => setDdOpen(o => !o)}
          >
            <span className="lang-current-text">{LOCALE_FLAGS[locale] ?? LOCALE_FLAGS.en}</span>
            <i className="fas fa-chevron-down" />
          </button>
          {ddOpen && (
            <div className="lang-dropdown open">
              {routing.locales.map(l => (
                <button key={l} className="lang-option" onClick={() => switchLocale(l)}>
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link href="/#download" className="nav-cta">{t('download')}</Link>
      </div>
    </nav>
  );
}
