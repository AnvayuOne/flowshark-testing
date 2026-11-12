import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anvayu Test Tracker',
  description: 'Internal QA test case tracking for Anvayu One',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
