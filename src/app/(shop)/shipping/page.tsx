"use client";

import { Clock, Package, Truck } from "lucide-react";
import { motion } from "motion/react";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 md:px-8 mb-16"
      >
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-sm font-medium tracking-widest text-primary uppercase mb-4 block">
            Delivery Information
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6 text-balance">
            Shipping & Delivery
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            At Royals and Radiant, we understand that your purchase is an
            investment in style and elegance. We are committed to ensuring your
            pieces arrive safely, securely, and as quickly as possible.
          </p>
        </div>
      </motion.section>

      {/* Icons Section */}
      <section className="container mx-auto px-4 md:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold text-foreground mb-2">
              Fast Processing
            </h3>
            <p className="text-sm text-foreground/60">2–4 business days</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold text-foreground mb-2">
              Secure Packaging
            </h3>
            <p className="text-sm text-foreground/60">
              Bespoke packaging process
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold text-foreground mb-2">
              Full Tracking
            </h3>
            <p className="text-sm text-foreground/60">
              Track your order anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Processing Times */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
                1. Processing Times
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Every order undergoes a rigorous quality control check and
                bespoke packaging process.
              </p>
              <div className="bg-card p-6 rounded-lg border border-border/40">
                <p className="font-sans font-semibold text-foreground mb-2">
                  Ready-to-Ship Items
                </p>
                <p className="text-foreground/70">
                  Dispatched within <strong>2–4 business days</strong>.
                </p>
              </div>
              <p className="text-sm text-foreground/60 italic mt-4">
                Note: You will receive a notification as soon as your order
                leaves our warehouse.
              </p>
            </motion.div>

            {/* Tracking Your Order */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
                2. Tracking Your Order
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Once your order is dispatched, a confirmation email will be sent
                containing your tracking number and a direct link to follow your
                package&apos;s journey.
              </p>
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground/70">
                  <strong className="text-foreground">Security Note:</strong>{" "}
                  For security reasons, high-value jewelry orders may require a
                  signature upon delivery.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-foreground/60 mb-6">
            Have questions about shipping? We&apos;re here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-sans text-sm font-medium tracking-wider uppercase rounded-full hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </motion.div>
      </section>
    </div>
  );
}
