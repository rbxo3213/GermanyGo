import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Germa-Niche 2026',
    description: 'Private Group Trip App',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Germa-Niche',
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: '#FFFFFF',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-white text-black antialiased">
                {children}
                {/* Kakao SDK Script */}
                {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js" crossOrigin="anonymous"></script>
            </body>
        </html>
    );
}
