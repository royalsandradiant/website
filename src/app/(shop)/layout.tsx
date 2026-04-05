import Link from "next/link";
import HeaderShell from "@/app/ui/header-shell";
import QueryProvider from "@/app/ui/query-provider";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <HeaderShell />
        <main className="flex-1 pt-24">{children}</main>
        <footer className="border-t border-white/5 bg-secondary/50 pt-16 pb-8">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-12 grid grid-cols-1 gap-10 text-left md:grid-cols-4 md:gap-12">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <Link
                  href="/"
                  className="font-display text-2xl font-bold text-foreground mb-4 block"
                >
                  Royals and Radiant
                </Link>
                <p className="text-sm text-foreground/60 leading-relaxed text-pretty">
                  Timeless elegance for the modern journey. Discover jewelry
                  that celebrates your unique story.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">
                  Quick Links
                </p>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/products/category/all"
                      className="text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Shop All
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/sale"
                      className="text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Sale
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/combos"
                      className="text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Combos
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Our Story
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Customer Care */}
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">
                  Customer Care
                </p>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/contact"
                      className="font-sans text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shipping"
                      className="font-sans text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/returns"
                      className="font-sans text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Return Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refunds"
                      className="font-sans text-sm text-foreground/60 hover:text-primary transition-colors"
                    >
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Newsletter/Social */}
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">
                  Connect
                </p>
                <p className="font-sans text-sm text-foreground/60 mb-4">
                  Follow us for updates and new collections.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com/royalsandradiant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-sans text-xs">IG</span>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-sans text-xs">FB</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="pt-6 pb-4 border-t border-white/5">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
                <Link
                  href="/terms"
                  className="font-sans text-xs text-foreground/50 hover:text-primary transition-colors"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="font-sans text-xs text-foreground/50 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/returns"
                  className="font-sans text-xs text-foreground/50 hover:text-primary transition-colors"
                >
                  Returns
                </Link>
                <Link
                  href="/refunds"
                  className="font-sans text-xs text-foreground/50 hover:text-primary transition-colors"
                >
                  Refunds
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-center">
              <p className="font-sans text-xs text-foreground/40">
                © {new Date().getFullYear()} Royals and Radiant by Upasana and
                Foram. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </QueryProvider>
  );
}
