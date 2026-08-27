import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toledo · Visita cultural e institucional',
  description:
    'Aplicación de apoyo para la visita cultural e institucional a Toledo del CEMFAS.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/images/app-icon-192.png',
    apple: '/images/apple-touch-icon-180.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
