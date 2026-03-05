"use client";

import { motion } from "motion/react";

export default function RefundsPage() {
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
            Payment Information
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6 text-balance">
            Refund Policy
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            Our refund policy outlines how we handle payment disputes and the
            limited circumstances under which refunds may be issued.
          </p>
        </div>
      </motion.section>

      {/* Content Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* No Refunds Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 bg-primary/5 border border-primary/20 rounded-lg p-8"
          >
            <h2 className="font-display text-2xl text-primary mb-4">
              No Refunds Policy
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              Due to the nature of our jewelry products and for hygiene and
              safety reasons,{" "}
              <strong>Royals and Radiant does not offer refunds</strong> on any
              purchases. All sales are final once payment is completed and items
              are delivered.
            </p>
          </motion.div>

          {/* Exceptional Circumstances */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Exceptional Circumstances
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              While our standard policy is no refunds, we recognize that
              exceptional circumstances may occur. Refunds will only be
              considered in the following limited situations:
            </p>
            <ul className="space-y-4 text-foreground/70">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">1.</span>
                <div>
                  <strong className="text-foreground">
                    Item Not Received:
                  </strong>{" "}
                  If your order was never delivered and tracking confirms it was
                  not received by you.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">2.</span>
                <div>
                  <strong className="text-foreground">
                    Significantly Different Item:
                  </strong>{" "}
                  If the item received is materially different from what was
                  described and pictured on our website (e.g., wrong product,
                  significantly different materials).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">3.</span>
                <div>
                  <strong className="text-foreground">
                    Duplicate Charges:
                  </strong>{" "}
                  If you were accidentally charged multiple times for the same
                  order due to a technical error.
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Refund Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              How to Request a Review
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              If you believe your situation qualifies for an exception, please
              follow these steps:
            </p>
            <div className="bg-secondary/50 p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <span className="font-display text-primary">1.</span>
                <p className="text-foreground/70">
                  <strong>Contact us within 48 hours</strong> of receiving your
                  order (or the expected delivery date for non-received items).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-display text-primary">2.</span>
                <p className="text-foreground/70">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:royalsandradiant@gmail.com"
                    className="text-primary hover:underline"
                  >
                    royalsandradiant@gmail.com
                  </a>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-display text-primary">3.</span>
                <p className="text-foreground/70">
                  <strong>Include:</strong> Your order number, detailed
                  explanation of the issue, and clear photos (if applicable).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-display text-primary">4.</span>
                <p className="text-foreground/70">
                  <strong>Response Time:</strong> We will review your request
                  and respond within 5-7 business days.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Dispute Resolution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Dispute Resolution
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We aim to resolve all concerns amicably. If you are not satisfied
              with our response to your concern, we encourage you to contact us
              again to discuss alternative solutions. However, please note that
              our no-refund policy will be enforced except in the exceptional
              circumstances outlined above.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              If you choose to initiate a chargeback through your credit card
              company or bank without first contacting us, we reserve the right
              to provide all relevant documentation to the payment processor
              demonstrating that our policies were clearly communicated and
              agreed to at the time of purchase.
            </p>
          </motion.div>

          {/* Payment Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              Payment Security
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              All payments are processed securely through Stripe, a
              PCI-compliant payment processor. Your payment information is
              encrypted and never stored on our servers. If you experience any
              unauthorized charges, please contact your bank immediately and
              notify us at{" "}
              <a
                href="mailto:royalsandradiant@gmail.com"
                className="text-primary hover:underline"
              >
                royalsandradiant@gmail.com
              </a>
              .
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
              Questions about our refund policy? Contact us before placing your
              order.
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
