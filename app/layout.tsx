import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100 Lajia',
  description: 'Bird sightings competition tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Crimson+Pro:ital,wght@0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
