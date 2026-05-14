import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import RegisterPage from '@/app/[locale]/dashboard/register/page';

const mockReplace = vi.hoisted(() => vi.fn());
const mockRegister = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  register: mockRegister,
}));

const mockUser = { id: '2', email: 'new@b.com', name: 'New User', locale: 'en', created_at: '2024-01-01' };

describe('RegisterPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockRegister.mockClear();
  });

  function fillAndSubmit(container: HTMLElement) {
    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'New User' } });
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'new@b.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button'));
  }

  it('renders name, email, and password inputs', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('calls register with all fields on submit', async () => {
    mockRegister.mockResolvedValueOnce(mockUser);
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('New User', 'new@b.com', 'password123'));
  });

  it('redirects to /dashboard on success', async () => {
    mockRegister.mockResolvedValueOnce(mockUser);
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error banner when registration throws', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already registered'));
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);
    await waitFor(() => expect(screen.getByText('Email already registered')).toBeInTheDocument());
  });

  it('contains a link to the login page', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /register\.login/i })).toHaveAttribute('href', '/dashboard/login');
  });
});
