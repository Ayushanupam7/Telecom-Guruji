const path = require('path');

process.env.NEXT_DISABLE_SWC_LOCKFILE_PATCH = '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    '@signalhub/shared',
    '@signalhub/types',
    '@signalhub/validation',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.dirname(require.resolve('react/package.json')),
      'react-dom': path.dirname(require.resolve('react-dom/package.json')),
    };
    return config;
  },
};

module.exports = nextConfig;
