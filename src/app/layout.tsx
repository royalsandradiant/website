import type { Metadata, Viewport } from "next";
import { Italiana, Mulish } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/lib/cart-context";
import { PageTransition } from "@/app/ui/page-transition";

const italiana = Italiana({
  variable: "--font-italiana",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Royals and Radiant | by Upasana and Foram",
  description: "Where tradition meets modern elegance. Discover jewelry that celebrates your unique journey and style.",
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
        className={`${italiana.variable} ${mulish.variable} antialiased bg-background text-foreground selection:bg-accent selection:text-accent-foreground min-h-screen`}
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
