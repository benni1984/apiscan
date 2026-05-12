import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Nav from '@/components/Nav';

// vi.hoisted ensures mockReplace is available inside the hoisted vi.mock factory
const mockReplace = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void
  }) => <a href={href} className={className} onClick={onClick}>{children}</a>,
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/i18n/routing', () => ({
  routing: { locales: ['en', 'de', 'fr', 'es'] },
}));

describe('Nav', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders the logo link', () => {
    render(<Nav locale="en" />);
    // Logo renders as: 🐝 Api<span>Scan</span> — use accessible name query
    expect(screen.getByRole('link', { name: /ApiScan/i })).toBeInTheDocument();
  });

  it('shows the correct flag/code for EN locale', () => {
    render(<Nav locale="en" />);
    expect(screen.getByText('🇬🇧 EN')).toBeInTheDocument();
  });

  it('shows the correct flag/code for DE locale', () => {
    render(<Nav locale="de" />);
    expect(screen.getByText('🇩🇪 DE')).toBeInTheDocument();
  });

  it('shows the correct flag/code for FR locale', () => {
    render(<Nav locale="fr" />);
    expect(screen.getByText('🇫🇷 FR')).toBeInTheDocument();
  });

  it('shows the correct flag/code for ES locale', () => {
    render(<Nav locale="es" />);
    expect(screen.getByText('🇪🇸 ES')).toBeInTheDocument();
  });

  it('dropdown is closed initially', () => {
    render(<Nav locale="en" />);
    expect(screen.queryByText('🇬🇧 English')).not.toBeInTheDocument();
  });

  it('opens language dropdown when the switcher button is clicked', () => {
    render(<Nav locale="en" />);
    fireEvent.click(screen.getByLabelText('Switch language'));
    expect(screen.getByText('🇬🇧 English')).toBeInTheDocument();
    expect(screen.getByText('🇩🇪 Deutsch')).toBeInTheDocument();
    expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸 Español')).toBeInTheDocument();
  });

  it('calls router.replace with the target locale when a language option is clicked', () => {
    render(<Nav locale="en" />);
    fireEvent.click(screen.getByLabelText('Switch language'));
    fireEvent.click(screen.getByText('🇩🇪 Deutsch'));
    expect(mockReplace).toHaveBeenCalledOnce();
    expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'de' });
  });

  it('closes the dropdown after switching locale', () => {
    render(<Nav locale="en" />);
    fireEvent.click(screen.getByLabelText('Switch language'));
    fireEvent.click(screen.getByText('🇩🇪 Deutsch'));
    expect(screen.queryByText('🇩🇪 Deutsch')).not.toBeInTheDocument();
  });

  it('toggles the mobile menu open when hamburger is clicked', () => {
    render(<Nav locale="en" />);
    const navLinks = document.querySelector('#nav-links')!;
    expect(navLinks.className).not.toContain('open');
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(navLinks.className).toContain('open');
  });

  it('closes the mobile menu on second click', () => {
    render(<Nav locale="en" />);
    const navLinks = document.querySelector('#nav-links')!;
    fireEvent.click(screen.getByLabelText('Open menu'));
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(navLinks.className).not.toContain('open');
  });

  it('adds page-nav class when isHome is false', () => {
    render(<Nav locale="en" isHome={false} />);
    expect(document.querySelector('#site-nav')?.className).toContain('page-nav');
  });

  it('does not add page-nav class when isHome is true', () => {
    render(<Nav locale="en" isHome={true} />);
    expect(document.querySelector('#site-nav')?.className).not.toContain('page-nav');
  });
});
