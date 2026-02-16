"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { CategoryWithChildren } from "@/app/lib/definitions";

interface HeaderProps {
  categories: CategoryWithChildren[];
}

export default function Header({ categories }: HeaderProps) {
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<
    string | null
  >(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md "
            : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        {/* Top Bar with Logo */}
        <div className="container mx-auto px-4 md:px-8">
          <div className="relative flex items-center justify-between py-3 sm:py-4">
            {/* Logo */}
            <Link
              href="/"
              className="group relative flex flex-col focus-visible:outline-none"
            >
              <h1 className="font-display text-xl leading-none tracking-tight text-foreground sm:text-2xl md:text-4xl lg:text-5xl">
                Royals and Radiant
              </h1>
              <span className="mt-0.5 text-xs font-bold text-foreground/80 sm:text-sm md:text-base">
                by Upasana and Foram
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full group-focus-visible:w-full"></span>
            </Link>

            {/* Right: Cart & Mobile Menu */}
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="group relative p-2"
                aria-label={`View cart with ${itemCount} items`}
              >
                <ShoppingBag className="h-5 w-5 text-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary" />
                <AnimatePresence>
                  {mounted && itemCount > 0 && (
                    <motion.span
                      initial={
                        shouldReduceMotion ? { opacity: 0 } : { scale: 0 }
                      }
                      animate={
                        shouldReduceMotion ? { opacity: 1 } : { scale: 1 }
                      }
                      exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="xl:hidden p-2 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar - Desktop */}
        <div className="hidden xl:block border-t border-border/75">
          <div className="container mx-auto px-4 md:px-8">
            <nav className="flex items-center justify-center gap-1">
              {/* Home */}
              <motion.div whileHover={shouldReduceMotion ? {} : { y: -1 }}>
                <Link
                  href="/"
                  className="px-4 py-3 text-sm font-bold tracking-wide hover:text-primary transition-colors focus-visible:text-primary outline-none"
                >
                  HOME
                </Link>
              </motion.div>

              {/* Product Categories with Dropdowns */}
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="relative group"
                  whileHover={shouldReduceMotion ? {} : { y: -1 }}
                >
                  <Link
                    href={`/products/category/${category.slugPath}`}
                    className={`flex items-center gap-1 px-4 py-3 text-sm font-bold tracking-wide transition-colors focus-visible:text-primary outline-none ${
                      activeDropdown === category.id
                        ? "text-primary"
                        : "hover:text-primary"
                    }`}
                    onMouseEnter={() => setActiveDropdown(category.id)}
                    onFocus={() => setActiveDropdown(category.id)}
                  >
                    {category.name.toUpperCase()}
                    {category.children.length > 0 && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${activeDropdown === category.id ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>

                  <AnimatePresence>
                    {activeDropdown === category.id &&
                      category.children.length > 0 && (
                        <motion.div
                          initial={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 10 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 10 }
                          }
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-0 w-64 bg-card border border-border shadow-xl z-50"
                          onMouseEnter={() => setActiveDropdown(category.id)}
                          onMouseLeave={() => setActiveDropdown(null)}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setActiveDropdown(null);
                            }
                          }}
                        >
                          {/* Shop All Link */}
                          <Link
                            href={`/products/category/${category.slugPath}`}
                            className="block px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary hover:text-primary transition-colors border-b border-border"
                          >
                            Shop All {category.name}
                          </Link>

                          {/* Subcategory Header */}
                          <div className="px-5 py-2 bg-secondary/50">
                            <span className="text-xs font-semibold tracking-wider text-foreground/60 uppercase">
                              Shop by Type
                            </span>
                          </div>

                          {/* Subcategories */}
                          <div className="py-2">
                            {category.children.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products/category/${sub.slugPath}`}
                                className="block px-5 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-primary transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>

                          {/* Sale Section */}
                          <div className="border-t border-border px-5 py-3 bg-primary/5">
                            <Link
                              href={`/sale?category=${category.slugPath}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {category.name} on Sale →
                            </Link>
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Sale */}
              <motion.div whileHover={shouldReduceMotion ? {} : { y: -1 }}>
                <Link
                  href="/sale"
                  className="px-4 py-3 text-sm font-bold tracking-wide text-primary hover:text-primary/80 transition-colors focus-visible:underline outline-none"
                >
                  SALE
                </Link>
              </motion.div>

              {/* Combos */}
              <motion.div whileHover={shouldReduceMotion ? {} : { y: -1 }}>
                <Link
                  href="/combos"
                  className="px-4 py-3 text-sm font-bold tracking-wide text-primary hover:text-primary/80 transition-colors focus-visible:underline outline-none"
                >
                  COMBOS
                </Link>
              </motion.div>

              {/* About */}
              <motion.div whileHover={{ y: -1 }}>
                <Link
                  href="/about"
                  className="px-4 py-3 text-sm font-bold tracking-wide hover:text-primary transition-colors"
                >
                  ABOUT
                </Link>
              </motion.div>

              {/* Contact */}
              <motion.div whileHover={{ y: -1 }}>
                <Link
                  href="/contact"
                  className="px-4 py-3 text-sm font-bold tracking-wide hover:text-primary transition-colors"
                >
                  CONTACT US
                </Link>
              </motion.div>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background pt-20 xl:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <nav className="container mx-auto px-6 py-8 flex flex-col gap-2">
              <Link
                href="/"
                className="py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              <div className="border-t border-border my-2"></div>

              {/* Mobile Category Accordions */}
              {categories.map((category) => (
                <div key={category.id} className="border-b border-border/50">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMobileCategory(
                        expandedMobileCategory === category.id
                          ? null
                          : category.id,
                      )
                    }
                    className="w-full flex items-center justify-between py-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    {category.name}
                    {category.children.length > 0 && (
                      <ChevronRight
                        className={`h-5 w-5 transition-transform ${
                          expandedMobileCategory === category.id
                            ? "rotate-90"
                            : ""
                        }`}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedMobileCategory === category.id &&
                      category.children.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pb-3 space-y-2">
                            <Link
                              href={`/products/category/${category.slugPath}`}
                              className="block py-2 text-sm font-medium text-primary"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Shop All {category.name}
                            </Link>
                            {category.children.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products/category/${sub.slugPath}`}
                                className="block py-2 text-sm text-foreground/70 hover:text-primary"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              ))}

              <Link
                href="/sale"
                className="py-3 text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sale
              </Link>
              <Link
                href="/combos"
                className="py-3 text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Combos
              </Link>

              <Link
                href="/about"
                className="py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
