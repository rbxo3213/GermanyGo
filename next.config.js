/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@firebase/auth'],
    experimental: {
        serverComponentsExternalPackages: ['undici', 'firebase']
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't bundle undici on the client
            config.resolve.alias.undici = false;
        }
        return config;
    },
};

module.exports = nextConfig;
