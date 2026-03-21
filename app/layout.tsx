import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100 Lajia Tracker',
  description: 'Bird sightings competition tracker'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
