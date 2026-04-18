import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nebulearn",
  description: "Generate nebulas and planets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Exo+2:ital,wght@0,200;0,300;0,400;0,500;1,200&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
