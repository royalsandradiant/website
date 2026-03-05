'use client';

import { motion } from 'motion/react';

export default function ReturnsPage() {
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
            Our Promise
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6 text-balance">
            Return Policy
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            We take pride in the quality of our jewelry. Please review our return policy carefully before making a purchase.
          </p>
        </div>
      </motion.section>

      {/* Content Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* All Sales Final Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 bg-primary/5 border border-primary/20 rounded-lg p-8"
          >
            <h2 className="font-display text-2xl text-primary mb-4">All Sales Are Final</h2>
            <p className="text-foreground/70 leading-relaxed">
              At Royals and Radiant, <strong>all sales are final</strong>. Due to the nature of our products 
              and for hygiene and safety reasons, we do not accept returns or exchanges on any items once 
              they have been purchased and delivered.
            </p>
          </motion.div>

          {/* Quality Assurance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Our Quality Commitment
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We understand that purchasing jewelry online requires trust. That is why we:
            </p>
            <ul className="space-y-3 text-foreground/70">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✦</span>
                <span>Thoroughly inspect every piece before shipping</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✦</span>
                <span>Provide detailed product descriptions and high-quality images</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✦</span>
                <span>Use secure, protective packaging to ensure items arrive in perfect condition</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✦</span>
                <span>Offer responsive customer service to answer any questions before purchase</span>
              </li>
            </ul>
          </motion.div>

          {/* Damaged or Defective Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Damaged or Defective Items
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              While all sales are final, we stand behind the quality of our products. If you receive an 
              item that is damaged or defective upon delivery, please contact us within 48 hours of receipt 
              with photos of the damage.
            </p>
            <div className="bg-secondary/50 p-6 rounded-lg">
              <p className="text-foreground/70 text-sm">
                <strong>To report a damaged item:</strong><br />
                Email us at{' '}
                <a href="mailto:royalsandradiant@gmail.com" className="text-primary hover:underline">
                  royalsandradiant@gmail.com
                </a>{' '}
                with your order number and clear photos of the damage. We will review your case and 
                respond within 2 business days.
              </p>
            </div>
          </motion.div>

          {/* Order Cancellations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Order Cancellations
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              Orders may be cancelled within 2 hours of placement if they have not yet been processed 
              for shipping. To request a cancellation, contact us immediately at{' '}
              <a href="tel:+2012890813" className="text-primary hover:underline">
                +1 (201) 289-0813
              </a>{' '}
              during business hours. Once an order has been processed and shipped, it cannot be cancelled.
            </p>
          </motion.div>

          {/* Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center pt-8 border-t border-border"
          >
            <p className="text-foreground/60 mb-4">
              Have questions before purchasing? We are here to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-sans text-sm font-medium tracking-wider uppercase rounded-full hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
