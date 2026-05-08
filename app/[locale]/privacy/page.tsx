import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = [
    { title: t('s1title'), body: t('s1body') },
    { title: t('s2title'), body: t('s2body') },
    { title: t('s3title'), body: t('s3body') },
    { title: t('s4title'), body: t('s4body') },
    { title: t('s5title'), body: t('s5body') },
    { title: t('s6title'), body: t('s6body') },
    { title: t('s7title'), body: t('s7body') },
    { title: t('s8title'), body: t('s8body') },
  ];

  return (
    <main className="legal-page">
      <div className="container">
        <h1>{t('title')}</h1>
        <p className="legal-updated">{t('updated')}</p>
        <p className="legal-intro">{t('intro')}</p>
        {sections.map((s, i) => (
          <section key={i}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
