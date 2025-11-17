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
      {
        // 1. The public URL you want to use in the frontend
        source: "/backend/:path*",
        // 2. The destination
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/:path*" // DEV: Strip "/backend" so Python sees "/categories"
            : "/api/index.py", // PROD: Point to the Vercel Function file
      }
    ];
  },
};
module.exports = nextConfig;