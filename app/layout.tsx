import type { Metadata } from "next";
import "./globals.css";

const DOMAIN = 'https://www.capellanservicio.com';

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),

  title: {
    default: 'Capellán Auto Solution Express — Reserva tu Servicio',
    template: '%s | Capellán Auto Solution Express',
  },
  description: 'Taller mecánico en República Dominicana. Reserva tu cita en línea para cambio de aceite, frenos, A/C, inspección y más. Rápido, confiable y experto.',

  keywords: [
    'taller mecánico República Dominicana',
    'mecánico Santo Domingo',
    'cambio de aceite RD',
    'servicio de frenos RD',
    'inspección de vehículos RD',
    'Capellán Auto',
    'auto repair Dominican Republic',
    'reserva cita taller',
  ],

  authors: [{ name: 'Capellán Auto Solution Express' }],
  creator: 'Capellán Auto Solution Express',

  openGraph: {
    type: 'website',
    locale: 'es_DO',
    url: DOMAIN,
    siteName: 'Capellán Auto Solution Express',
    title: 'Capellán Auto Solution Express — Reserva tu Servicio',
    description: 'Taller mecánico en República Dominicana. Reserva tu cita en línea. Rápido, confiable y experto.',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Capellán Auto Solution Express',
      },
    ],
  },

  twitter: {
    card: 'summary',
    title: 'Capellán Auto Solution Express',
    description: 'Reserva tu cita de taller mecánico en línea — República Dominicana.',
    images: ['/logo.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  alternates: {
    canonical: DOMAIN,
    languages: {
      'es-DO': DOMAIN,
      'es':    DOMAIN,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* hreflang — tells Google this is Spanish content for Dominican Republic */}
        <link rel="alternate" hrefLang="es-DO" href={DOMAIN} />
        <link rel="alternate" hrefLang="es"    href={DOMAIN} />
        <link rel="alternate" hrefLang="x-default" href={DOMAIN} />

        {/* Geo targeting */}
        <meta name="geo.region"      content="DO" />
        <meta name="geo.country"     content="Dominican Republic" />
        <meta name="language"        content="Spanish" />
        <meta name="content-language" content="es-DO" />

        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#111111" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Capellán Auto" />
      </head>
      <body className="min-h-screen bg-[#1A1A1A]">{children}</body>
    </html>
  );
}
