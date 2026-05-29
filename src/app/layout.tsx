import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nova-systems.app"),
  title: "Nova Systems — Operational Intelligence",
  description: "We find the revenue your business doesn't know it's losing. Operational intelligence for service businesses.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nova Systems",
  },
  openGraph: {
    title: "Nova Systems — Operational Intelligence for Service Businesses",
    description: "We show you exactly where your business is losing revenue. Most clients recover $47K+ in 90 days.",
    url: "https://nova-systems.app",
    siteName: "Nova Systems",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nova Systems",
    description: "Stop losing leads. Start recovering revenue.",
  },
};

export const viewport: Viewport = {
  themeColor: "#C6A15B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
