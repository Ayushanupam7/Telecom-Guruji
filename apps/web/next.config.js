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
};

module.exports = nextConfig;
