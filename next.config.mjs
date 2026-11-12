/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Load pg from node_modules at runtime instead of bundling it.
    serverComponentsExternalPackages: ['pg'],
    // Ship the SQL files with the server functions so an empty database can be set up automatically.
    outputFileTracingIncludes: { '/**': ['./db/*.sql'] },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
