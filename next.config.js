/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add explicit mapping for auth routes so `/auth/*` and `/api/auth/*`
  // hit the catch-all API file `app/api/auth/[...all]/route.ts`.
  rewrites: async () => {
    return [
      // Ensure auth rewrite is first so it takes precedence over other rules
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: "/backend/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/backend/:path*"
            : "/api/backend/index.py",
      },
    ];
  },
};
module.exports = nextConfig;