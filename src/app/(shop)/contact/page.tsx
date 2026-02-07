'use client';

import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useActionState } from 'react';
import { submitContactForm, ContactFormState } from '@/app/lib/actions';

const initialState: ContactFormState = {};

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

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
            Get in Touch
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-foreground mb-6">
            Contact Us
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            We&apos;d love to hear from you. Whether you have a question about our collections, 
            need styling advice, or want to share your Royals and Radiant experience.
          </p>
        </div>
      </motion.section>

      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl text-foreground mb-6">Send us a Message</h2>
            
            {state.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-secondary/50 rounded-lg p-8 text-center"
              >
                <span className="text-4xl mb-4 block">✨</span>
                <h3 className="font-display text-xl text-foreground mb-2">Thank You!</h3>
                <p className="text-foreground/60">
                  {state.message || "We've received your message and will get back to you within 24 hours."}
                </p>
              </motion.div>
            ) : (
              <form action={formAction} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Honeypot field - hidden from users but detectable by bots */}
                  <div className="opacity-0 absolute -z-10 select-none pointer-events-none" aria-hidden="true">
                    <label htmlFor="b_website">Website</label>
                    <input
                      type="text"
                      id="b_website"
                      name="b_website"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                    <input
                      type="hidden"
                      name="form_ts"
                      value={Date.now()}
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground/70 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Jane Doe"
                    />
                    {state.errors?.name && (
                      <p className="mt-1 text-sm text-red-500">{state.errors.name[0]}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground/70 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="jane@example.com"
                    />
                    {state.errors?.email && (
                      <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground/70 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="How can we help?"
                  />
                  {state.errors?.subject && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.subject[0]}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground/70 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Tell us more..."
                  />
                  {state.errors?.message && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.message[0]}</p>
                  )}
                </div>

                {state.message && !state.success && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{state.message}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-primary text-primary-foreground font-medium tracking-wide rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="font-display text-2xl text-foreground mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Email Us</h3>
                  <a href="mailto:royalsandradiant@gmail.com" className="text-foreground/60 hover:text-primary transition-colors">
                    royalsandradiant@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Call Us</h3>
                  <a href="tel:+2012890813" className="text-foreground/60 hover:text-primary transition-colors">
                    +1 (201) 289-0813
                  </a>
                  <br />
                  <a href="tel:+3024194466" className="text-foreground/60 hover:text-primary transition-colors">
                    +1 (302) 419-4466
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Visit Us</h3>
                  <p className="text-foreground/60">
                    210 Terrace Avenue<br />
                    Jersey City, NJ 07307
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Business Hours</h3>
                  <p className="text-foreground/60">
                    Mon - Fri: 10:00 AM - 5:00 PM<br />
                    Sat: 11:00 AM - 5:00 PM<br />
                    Sun: Closed
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
