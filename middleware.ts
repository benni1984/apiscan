import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'de', 'fr', 'es'] as const;
const defaultLocale = 'en';

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }
  const acceptLang = request.headers.get('accept-language') ?? '';
  for (const lang of acceptLang.split(',')) {
    const tag = lang.split(';')[0].trim().toLowerCase();
    const locale = locales.find(l => tag === l || tag.startsWith(`${l}-`));
    if (locale) return locale;
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocalePrefix = locales.some(
    l => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (hasLocalePrefix) return NextResponse.next();

  const locale = detectLocale(request);

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|\\..*).*)'],
};
