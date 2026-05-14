'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('dash');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-overlay dash-auth-center">
      <div className="dash-auth-card">
        <div className="dash-auth-brand">🐝 Api<strong>Scan</strong></div>
        <h1>{t('login.title')}</h1>
        {error && <div className="dash-error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="dash-form-group">
            <label>{t('login.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="dash-form-group">
            <label>{t('login.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="dash-submit-btn" type="submit" disabled={loading}>
            {loading ? '…' : t('login.submit')}
          </button>
        </form>
        <p className="dash-auth-link">
          {t('login.noAccount')} <Link href="/dashboard/register">{t('login.register')}</Link>
        </p>
      </div>
    </div>
  );
}
