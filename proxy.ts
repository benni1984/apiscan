import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude /api/* (backend), /_next/*, /_vercel/*, and static assets (paths with file extension)
  matcher: ['/((?!api/|_next|_vercel|\\..*).*)'],
};
