/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverComponentsExternalPackages: ["pino", "pino-pretty"],
    },
  };
  

export default nextConfig;
