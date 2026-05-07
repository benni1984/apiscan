import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  webpack(config) {
    config.optimization = config.optimization || {};
    config.optimization.concatenateModules = false;
    return config;
  },
  async redirects() {
    return [
      { source: '/index.html',     destination: '/',          permanent: true },
      { source: '/map.html',       destination: '/map',       permanent: true },
      { source: '/news.html',      destination: '/news',      permanent: true },
      { source: '/contribute.html',destination: '/contribute',permanent: true },
      { source: '/members.html',   destination: '/members',   permanent: true },
      { source: '/apiary.html',    destination: '/apiary',    permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
