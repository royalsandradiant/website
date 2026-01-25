import HeaderShell from "@/app/ui/header-shell";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
        <HeaderShell />
        <main className="flex-1 pt-24">{children}</main>
        <footer className="border-t border-white/5 bg-background py-12 text-center">
            <div className="container mx-auto px-4">
                <p className="font-sans text-sm text-foreground/40">
                    © {new Date().getFullYear()} Royals and Radiant by Upasana and Foram. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
  );
}
