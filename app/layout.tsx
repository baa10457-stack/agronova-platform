import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AGRONOVA | The Future of Global Agriculture',
  description:
    'AGRONOVA unites farm management, artificial intelligence, livestock, commerce, finance and education in one agricultural ecosystem.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-white font-sans text-stone-900 antialiased`}>{children}</body>
    </html>
  );
}
