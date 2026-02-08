import HeaderShell from "@/app/ui/header-shell";
import Link from "next/link";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
        <HeaderShell />
        <main className="flex-1 pt-24">{children}</main>
        <footer className="border-t border-white/5 bg-secondary/50 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-left">
                    {/* Brand Section */}
                    <div className="md:col-span-1">
                        <Link href="/" className="font-display text-2xl font-bold text-foreground mb-4 block">
                            Royals and Radiant
                        </Link>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Timeless elegance for the modern journey. Discover jewelry that celebrates your unique story.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link href="/products/category/all" className="text-sm text-foreground/60 hover:text-primary transition-colors">Shop All</Link></li>
                            <li><Link href="/sale" className="text-sm text-foreground/60 hover:text-primary transition-colors">Sale</Link></li>
                            <li><Link href="/combos" className="text-sm text-foreground/60 hover:text-primary transition-colors">Combos</Link></li>
                            <li><Link href="/about" className="text-sm text-foreground/60 hover:text-primary transition-colors">Our Story</Link></li>
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div>
                        <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">Customer Care</h4>
                        <ul className="space-y-4">
                            <li><Link href="/contact" className="text-sm text-foreground/60 hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link href="/shipping" className="text-sm text-foreground/60 hover:text-primary transition-colors">Shipping Info</Link></li>
                            <li className="text-sm text-foreground/40 italic">All Sales Final</li>
                        </ul>
                    </div>

                    {/* Newsletter/Social */}
                    <div>
                        <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6">Connect</h4>
                        <p className="text-sm text-foreground/60 mb-4">Follow us for updates and new collections.</p>
                        <div className="flex gap-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
                                <span className="text-xs">IG</span>
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
                                <span className="text-xs">FB</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 text-center">
                    <p className="font-sans text-xs text-foreground/40">
                        © {new Date().getFullYear()} Royals and Radiant by Upasana and Foram. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    </div>
  );
}
