import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Germa-Niche 2026',
    description: 'Private Group Trip App',
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
