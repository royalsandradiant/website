"use client";

import { motion } from "motion/react";

export default function TermsPage() {
  const lastUpdated = "March 4, 2026";

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
            Legal
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6 text-balance">
            Terms & Conditions
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            Please read these terms carefully before using our website or making
            a purchase.
          </p>
        </div>
      </motion.section>

      {/* Content Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-sm text-foreground/50"
          >
            <p>Last Updated: {lastUpdated}</p>
          </motion.div>

          {/* Agreement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              1. Agreement to Terms
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              By accessing or using the Royals and Radiant website (the
              &quot;Site&quot;) and making purchases, you agree to be bound by
              these Terms and Conditions. If you disagree with any part of these
              terms, you may not access the Site or make purchases.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              These Terms constitute a legally binding agreement between you and
              Royals and Radiant (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) regarding your use of the Site and any products
              purchased.
            </p>
          </motion.div>

          {/* Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              2. Products and Descriptions
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We make every effort to display our products and their colors as
              accurately as possible. However, we cannot guarantee that your
              device&apos;s display of any color will be accurate.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-4">
              All products are subject to availability. We reserve the right to
              discontinue any product at any time. Prices for products are
              subject to change without notice.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              Jewelry dimensions, weights, and specifications are approximate
              and may vary slightly from piece to piece due to the handcrafted
              nature of our products.
            </p>
          </motion.div>

          {/* Pricing and Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              3. Pricing and Payment
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              All prices are listed in US Dollars (USD) and do not include
              applicable taxes or shipping fees unless otherwise stated.
              Shipping costs will be calculated and displayed at checkout.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We accept payment through Stripe, which processes major credit
              cards and other payment methods. By providing payment information,
              you represent and warrant that you are authorized to use the
              payment method.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              All payments are processed securely. We do not store your full
              credit card information on our servers.
            </p>
          </motion.div>

          {/* Shipping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              4. Shipping and Delivery
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We ship to addresses within the United States, Canada, United
              Kingdom, Australia, and India. Delivery times are estimates and
              commence from the date of shipping, not the date of order.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We are not responsible for delays caused by customs, postal
              delays, or circumstances beyond our control. Risk of loss and
              title for items purchased pass to you upon delivery to the
              carrier.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              Please ensure your shipping address is accurate. We are not
              responsible for packages delivered to incorrect addresses provided
              by customers.
            </p>
          </motion.div>

          {/* Returns and Refunds */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              5. Returns and Refunds
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              <strong>All sales are final.</strong> Due to the nature of our
              jewelry products and for hygiene and safety reasons, we do not
              accept returns or exchanges, and we do not offer refunds except in
              limited exceptional circumstances as detailed in our{" "}
              <a href="/refunds" className="text-primary hover:underline">
                Refund Policy
              </a>
              .
            </p>
            <p className="text-foreground/70 leading-relaxed">
              By making a purchase, you acknowledge and agree to our no-returns
              and no-refunds policy.
            </p>
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
              6. Order Cancellations
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              Orders may be cancelled within 2 hours of placement if they have
              not yet been processed for shipping. Once an order has been
              processed and shipped, it cannot be cancelled. To request a
              cancellation, contact us immediately at{" "}
              <a
                href="tel:+2012890813"
                className="text-primary hover:underline"
              >
                +1 (201) 289-0813
              </a>
              .
            </p>
          </motion.div>

          {/* Intellectual Property */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              7. Intellectual Property
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              The Site and its original content, features, and functionality are
              owned by Royals and Radiant and are protected by international
              copyright, trademark, patent, trade secret, and other intellectual
              property laws.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              You may not reproduce, distribute, modify, create derivative works
              of, publicly display, publicly perform, republish, download,
              store, or transmit any of the material on our Site without our
              prior written consent.
            </p>
          </motion.div>

          {/* Prohibited Uses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              8. Prohibited Uses
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              You may use the Site only for lawful purposes and in accordance
              with these Terms. You agree not to use the Site:
            </p>
            <ul className="space-y-2 text-foreground/70">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>
                  In any way that violates any applicable federal, state, local,
                  or international law
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>
                  To transmit any advertising or promotional material, including
                  any &quot;junk mail,&quot; &quot;chain letter,&quot;
                  &quot;spam,&quot; or any other similar solicitation
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>
                  To impersonate or attempt to impersonate Royals and Radiant,
                  our employees, another user, or any other person or entity
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>
                  To engage in any other conduct that restricts or inhibits
                  anyone&apos;s use or enjoyment of the Site
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              The Site and all products are provided on an &quot;as is&quot; and
              &quot;as available&quot; basis. Royals and Radiant makes no
              representations or warranties of any kind, express or implied, as
              to the operation of the Site or the information, content,
              materials, or products included on the Site.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              To the full extent permissible by applicable law, Royals and
              Radiant disclaims all warranties, express or implied, including
              but not limited to implied warranties of merchantability and
              fitness for a particular purpose.
            </p>
          </motion.div>

          {/* Limitation of Liability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              10. Limitation of Liability
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              In no event shall Royals and Radiant, its directors, employees,
              partners, agents, suppliers, or affiliates be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses, resulting from your access
              to or use of or inability to access or use the Site or any
              products purchased.
            </p>
          </motion.div>

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              11. Governing Law
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the State of New Jersey, United States, without regard
              to its conflict of law provisions. You agree to submit to the
              personal and exclusive jurisdiction of the courts located within
              New Jersey.
            </p>
          </motion.div>

          {/* Changes to Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              12. Changes to Terms
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will
              provide at least 30 days&apos; notice prior to any new terms
              taking effect. What constitutes a material change will be
              determined at our sole discretion.
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center pt-8 border-t border-border"
          >
            <h2 className="font-display text-2xl text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-foreground/60 mb-6">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-foreground/60 mb-6">
              <p>
                Email:{" "}
                <a
                  href="mailto:royalsandradiant@gmail.com"
                  className="text-primary hover:underline"
                >
                  royalsandradiant@gmail.com
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href="tel:+2012890813"
                  className="text-primary hover:underline"
                >
                  +1 (201) 289-0813
                </a>
              </p>
              <p>Address: 210 Terrace Avenue, Jersey City, NJ 07307</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
