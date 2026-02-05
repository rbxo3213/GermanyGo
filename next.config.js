const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'firebase-storage-images',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                    },
                },
            },
            {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-image-assets',
                    expiration: {
                        maxEntries: 100, // Increased entries
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days (Data Saving)
                    },
                },
            },
            {
                urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'weather-api',
                    networkTimeoutSeconds: 5, // Fallback quickly if slow
                    expiration: {
                        maxEntries: 16,
                        maxAgeSeconds: 60 * 60, // 1 Hour
                    },
                },
            },
            {
                urlPattern: /^https:\/\/dapi\.kakao\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'kakao-api',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 Hours
                    },
                },
            },
        ],
    },
});

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

module.exports = withPWA(nextConfig);
