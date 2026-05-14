import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoginPage from '@/app/[locale]/dashboard/login/page';

const mockReplace = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  login: mockLogin,
}));

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', locale: 'en', created_at: '2024-01-01' };

describe('LoginPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogin.mockClear();
  });

  function fillAndSubmit(container: HTMLElement, email = 'a@b.com', password = 'pass123') {
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: email } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: password } });
    fireEvent.click(screen.getByRole('button'));
  }

  it('renders email and password inputs and a submit button', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(mockUser);
    const { container } = render(<LoginPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass123'));
  });

  it('redirects to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(mockUser);
    const { container } = render(<LoginPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error banner when login throws', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { container } = render(<LoginPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('disables submit button while request is in flight', async () => {
    let resolve!: () => void;
    mockLogin.mockReturnValueOnce(new Promise<typeof mockUser>(r => { resolve = () => r(mockUser); }));
    const { container } = render(<LoginPage />);
    fillAndSubmit(container);
    expect(screen.getByRole('button')).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('contains a link to the register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /login\.register/i })).toHaveAttribute('href', '/dashboard/register');
  });
});
