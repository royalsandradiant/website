'use client';

import { motion } from 'motion/react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 md:px-8 mb-20"
      >
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-sm font-medium tracking-widest text-primary uppercase mb-4 block">
            Our Story
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-foreground mb-6 text-balance">
            About Royals and Radiant
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            Where tradition meets contemporary elegance. We believe that jewelry is more than 
            adornment—it&apos;s a celebration of your unique story.
          </p>
        </div>
      </motion.section>

      {/* Story Section */}
      <section className="container mx-auto px-4 md:px-8 mb-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
                Crafting Beauty Since Day One
              </h2>
            </div>
            
            <div className="space-y-6 text-foreground/70 leading-relaxed text-lg">
              <p>
                Royals and Radiant was born from a passion for exquisite craftsmanship and a deep 
                appreciation for the art of adornment. Founded by Upasana and Foram, our name 
                represents the royal and radiant beauty that every piece in our 
                collection embodies.
              </p>
              <p>
                Every piece in our collection is carefully curated to bring you jewelry that 
                resonates with your personal style. Whether you&apos;re drawn to timeless classics 
                or contemporary designs, we have something that speaks to your soul.
              </p>
              <p>
                Our journey began with a simple belief: that high-quality, beautifully designed 
                jewelry should be accessible to everyone who appreciates the finer things in life. 
                We work closely with skilled artisans who use traditional techniques passed down 
                through generations, blending them with modern aesthetics to create pieces that 
                are both timeless and trend-setting.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 border-t border-border pt-8">
              <div className="text-center">
                <span className="font-display text-4xl md:text-5xl text-primary block mb-1">500+</span>
                <p className="text-sm text-foreground/50 uppercase tracking-widest">Unique Designs</p>
              </div>
              <div className="text-center">
                <span className="font-display text-4xl md:text-5xl text-primary block mb-1">1000+</span>
                <p className="text-sm text-foreground/50 uppercase tracking-widest">Happy Customers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-secondary/50 py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              What We Stand For
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Our values guide every decision we make, from sourcing to delivery.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality Craftsmanship',
                description: 'Each piece is meticulously crafted with attention to detail, ensuring lasting beauty and durability.',
                icon: '✦'
              },
              {
                title: 'Authentic Materials',
                description: 'We use only genuine gemstones and precious metals, guaranteeing authenticity in every creation.',
                icon: '◇'
              },
              {
                title: 'Customer First',
                description: 'Your satisfaction is our priority. We provide personalized service and hassle-free returns.',
                icon: '♡'
              }
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card p-8 rounded-lg text-center"
              >
                <span className="text-4xl text-primary mb-4 block">{value.icon}</span>
                <h3 className="font-display text-xl text-foreground mb-3">{value.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="container mx-auto px-4 md:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="mb-4 block mx-auto h-12 w-px bg-primary/30"></span>
          <p className="font-display text-3xl md:text-4xl italic text-foreground/80 leading-tight">
            &quot;Jewelry has the power to be this one little thing that can make you feel unique.&quot;
          </p>
          <span className="mt-8 block text-sm tracking-widest text-foreground/50 uppercase">
            — The Royals and Radiant Philosophy
          </span>
        </motion.div>
      </section>
    </div>
  );
}
