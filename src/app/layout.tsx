import type { Metadata, Viewport } from "next";
import { Italiana, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/lib/cart-context";
import { PageTransition } from "@/app/ui/page-transition";

import { getBaseUrl } from "@/app/lib/utils";

const italiana = Italiana({
  variable: "--font-italiana",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Royals and Radiant | by Upasana and Foram",
    template: "%s | Royals and Radiant",
  },
  description:
    "Where tradition meets modern elegance. Discover jewelry that celebrates your unique journey and style.",
  keywords: [
    "jewelry",
    "traditional jewelry",
    "modern elegance",
    "Indian jewelry",
    "Royals and Radiant",
    "luxury jewelry",
    "handmade jewelry",
  ],
  authors: [{ name: "Upasana" }, { name: "Foram" }],
  creator: "Royals and Radiant",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Royals and Radiant",
    title: "Royals and Radiant | by Upasana and Foram",
    description:
      "Where tradition meets modern elegance. Discover jewelry that celebrates your unique journey and style.",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Royals and Radiant - Traditional Jewelry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Royals and Radiant | by Upasana and Foram",
    description:
      "Where tradition meets modern elegance. Discover jewelry that celebrates your unique journey and style.",
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F2F0EA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${italiana.variable} ${montserrat.variable} antialiased bg-background text-foreground selection:bg-accent selection:text-accent-foreground min-h-screen font-sans`}
      >
        <CartProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </CartProvider>
      </body>
    </html>
  );
}
