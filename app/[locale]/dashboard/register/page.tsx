'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const t = useTranslations('dash');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-overlay dash-auth-center">
      <div className="dash-auth-card">
        <div className="dash-auth-brand">🐝 Api<strong>Scan</strong></div>
        <h1>{t('register.title')}</h1>
        {error && <div className="dash-error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="dash-form-group">
            <label>{t('register.name')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="dash-form-group">
            <label>{t('register.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="dash-form-group">
            <label>{t('register.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button className="dash-submit-btn" type="submit" disabled={loading}>
            {loading ? '…' : t('register.submit')}
          </button>
        </form>
        <p className="dash-auth-link">
          {t('register.hasAccount')} <Link href="/dashboard/login">{t('register.login')}</Link>
        </p>
      </div>
    </div>
  );
}
