'use client';

import { motion } from 'motion/react';

export default function PrivacyPage() {
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
            Your Privacy Matters
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6 text-balance">
            Privacy Policy
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            We value your privacy and are committed to protecting your personal information. 
            This policy explains how we collect, use, and safeguard your data.
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

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              1. Introduction
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              Royals and Radiant (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed 
              to protecting your personal data. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you visit our website or make a purchase.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              Please read this Privacy Policy carefully. By accessing or using our Site, you agree 
              to the practices described in this policy. If you do not agree with our policies 
              and practices, please do not use our Site.
            </p>
          </motion.div>

          {/* Information We Collect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              2. Information We Collect
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We collect several types of information from and about users of our Site:
            </p>
            <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
            <p className="text-foreground/70 leading-relaxed mb-4">
              When you make a purchase or contact us, we may collect:
            </p>
            <ul className="space-y-2 text-foreground/70 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Name and contact information (email address, phone number, billing and shipping addresses)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Payment information (processed securely through Stripe; we do not store full credit card numbers)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Purchase history and order details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Communications you send to us</span>
              </li>
            </ul>
            <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
            <p className="text-foreground/70 leading-relaxed">
              When you access our Site, we may automatically collect certain information about 
              your device and usage, including IP address, browser type, operating system, 
              referring URLs, and information about your browsing behavior on our Site.
            </p>
          </motion.div>

          {/* How We Use Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              3. How We Use Your Information
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="space-y-2 text-foreground/70">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Processing and fulfilling your orders</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Communicating with you about your orders, purchases, or inquiries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Sending order confirmations, shipping notifications, and customer service responses</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Responding to your comments, questions, and requests</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Improving our website, products, and services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Detecting and preventing fraud and unauthorized transactions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Complying with legal obligations</span>
              </li>
            </ul>
          </motion.div>

          {/* Information Sharing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information in the following circumstances:
            </p>
            <h3 className="font-semibold text-foreground mb-2">Service Providers</h3>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We may share your information with third-party service providers who perform 
              services on our behalf, such as:
            </p>
            <ul className="space-y-2 text-foreground/70 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Payment processing (Stripe)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Email delivery services (Resend)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Website hosting and analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Shipping and logistics providers</span>
              </li>
            </ul>
            <p className="text-foreground/70 leading-relaxed mb-4">
              These service providers have access to personal information needed to perform 
              their functions but are prohibited from using it for other purposes.
            </p>
            <h3 className="font-semibold text-foreground mb-2">Legal Requirements</h3>
            <p className="text-foreground/70 leading-relaxed">
              We may disclose your information if required to do so by law or in response to 
              valid requests by public authorities (e.g., a court or government agency).
            </p>
          </motion.div>

          {/* Data Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              5. Data Security
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or 
              destruction. These measures include:
            </p>
            <ul className="space-y-2 text-foreground/70 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>SSL/TLS encryption for data transmission</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Secure payment processing through PCI-compliant providers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Regular security assessments and updates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Limited access to personal information within our organization</span>
              </li>
            </ul>
            <p className="text-foreground/70 leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 
              100% secure. While we strive to use commercially acceptable means to protect 
              your personal information, we cannot guarantee its absolute security.
            </p>
          </motion.div>

          {/* Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              6. Cookies and Tracking Technologies
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your browsing 
              experience, analyze website traffic, and understand where our visitors are 
              coming from.
            </p>
            <p className="text-foreground/70 leading-relaxed mb-4">
              Cookies are small data files stored on your device. You can set your browser 
              to refuse all or some browser cookies, but this may affect your ability to 
              use certain features of our Site.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              We use cookies for:
            </p>
            <ul className="space-y-2 text-foreground/70">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Essential site functionality (e.g., shopping cart, checkout)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Analytics to understand how visitors interact with our Site</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>Remembering your preferences</span>
              </li>
            </ul>
          </motion.div>

          {/* Your Rights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              7. Your Privacy Rights
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal 
              information, including:
            </p>
            <ul className="space-y-2 text-foreground/70 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>The right to access the personal information we have about you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>The right to request correction of inaccurate information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>The right to request deletion of your personal information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>The right to opt-out of marketing communications</span>
              </li>
            </ul>
            <p className="text-foreground/70 leading-relaxed">
              To exercise these rights, please contact us using the information provided at 
              the end of this policy.
            </p>
          </motion.div>

          {/* Children */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              Our Site is not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13. If you are 
              a parent or guardian and believe your child has provided us with personal 
              information, please contact us, and we will take steps to delete such information.
            </p>
          </motion.div>

          {/* Changes to Policy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              We may update this Privacy Policy from time to time. The updated version will 
              be indicated by an updated &quot;Last Updated&quot; date. We encourage you to review this 
              Privacy Policy periodically to stay informed about how we are protecting your information.
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
            <h2 className="font-display text-2xl text-foreground mb-4">Contact Us</h2>
            <p className="text-foreground/60 mb-6">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2 text-foreground/60 mb-6">
              <p>Email: <a href="mailto:royalsandradiant@gmail.com" className="text-primary hover:underline">royalsandradiant@gmail.com</a></p>
              <p>Phone: <a href="tel:+2012890813" className="text-primary hover:underline">+1 (201) 289-0813</a></p>
              <p>Address: 210 Terrace Avenue, Jersey City, NJ 07307</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
