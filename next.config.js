/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/backend/:path*",
        // In development, forward /backend/* to the local Python backend root
        // (the backend exposes routes like /categories, /quiz/*, not /api/*).
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/:path*"
            : "/api/:path*",
      },
    ];
  }
};
module.exports = nextConfig;