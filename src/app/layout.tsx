import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "100 lajia — Havaintopäiväkirja",
  description: "Lintuhavaintojen kilpailukausi 2025",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body>
        <div className="max-w-app mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
