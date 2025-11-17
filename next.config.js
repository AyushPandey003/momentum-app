/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add explicit mapping for auth routes so `/auth/*` and `/api/auth/*`
  // hit the catch-all API file `app/api/auth/[...all]/route.ts`.
  rewrites: async () => {
    return [
      // Ensure direct API auth routes are routed to the Next API handlers
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Optional external-facing auth path
      // Ensure auth rewrite is first so it takes precedence over other rules
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
};
module.exports = nextConfig;