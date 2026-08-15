process.env.NEXT_DISABLE_SWC_LOCKFILE_PATCH = '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;

