const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  async rewrites() {
    return [
      { source: '/dashboard/transactions', destination: '/transactions' },
      { source: '/dashboard/reports', destination: '/reports' },
      { source: '/dashboard/budgets', destination: '/budgets' },
      { source: '/dashboard/wallets', destination: '/wallets' },
      { source: '/dashboard/settings', destination: '/settings' },
      { source: '/dashboard/calendar', destination: '/calendar' },
      { source: '/dashboard/tata-ai', destination: '/tata-ai' },
      { source: '/auth', destination: '/login' },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
