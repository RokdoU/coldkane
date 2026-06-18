import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { JsonLd } from "@/components/json-ld";
import { organizationLd, websiteLd } from "@/lib/structured-data";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// URL canonique du site : sert de base à toutes les URLs absolues des
// métadonnées (OG, sitemap, canonical). Surchargeable par variable d'env.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  // Indexation publique autorisée par défaut (les espaces privés se
  // désactivent page par page via robots: { index: false }).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // OG / Twitter par défaut : repris par toutes les pages sans carte dédiée.
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: SITE_URL,
    images: [
      {
        url: "/api/og/default",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    images: ["/api/og/default"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${grotesk.variable} ${inter.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* GEO : entité + site, lisibles par les moteurs IA sur chaque page */}
        <JsonLd data={[organizationLd(), websiteLd()]} />
        {children}
      </body>
    </html>
  );
}
