/** @type {import('next').NextConfig} */
const nextConfig = {
  // No custom rewrites needed — backend now lives under Next's `api/` routes.
  rewrites: async () => {
    return [
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