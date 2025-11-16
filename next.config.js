/** @type {import('next').NextConfig} */
const nextConfig = {
  // No custom rewrites needed — backend now lives under Next's `api/` routes.
  rewrites: async () => {
    return [];
  }
};
module.exports = nextConfig;