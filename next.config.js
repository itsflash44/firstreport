/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API calls to Python FastAPI backend
  async rewrites() {
    return [
      {
        source: '/python-api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  // Exclude Python directories from Next.js file watching
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/core/**', '**/legal/**', '**/offline/**', '**/output/**', '**/demo/**'],
    };
    return config;
  },
};

module.exports = nextConfig;
