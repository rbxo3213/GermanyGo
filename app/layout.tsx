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
            </body>
        </html>
    );
}
