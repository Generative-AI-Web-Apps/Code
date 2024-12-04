/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        config.externals = [...config.externals, "hnswlib-node"]
        config.resolve.fallback = { fs: false };
        return config
    },
}

export default nextConfig
