'use client';

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { HeroImage } from '@/app/lib/definitions';

export function Hero({ images }: { images: HeroImage[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  // Auto-scroll logic (Feature 1)
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  const currentImage = images.length > 0 ? images[index].imageUrl : "/hero.png";

  return (
    <section className="relative w-full pt-15 overflow-hidden">
      {/* Full Size Image Container */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        <motion.div
          className="relative h-full w-full"
          initial={shouldReduceMotion ? { opacity: 0 } : { scale: 1.1 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image 
                src={currentImage} 
                alt={images[index]?.altText || "Royals and Radiant Collection"} 
                fill 
                className="object-cover object-center" 
                priority 
              />
              {/* Overlay for better text contrast if needed later */}
              <div className="absolute inset-0 bg-black/5" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-10 right-10 flex gap-3 z-20">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
          
          {currentImage === "/hero.png" && (
            <div className="absolute bottom-12 left-12 max-w-xs backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/20">
              <p className="font-display text-xl md:text-2xl text-foreground leading-tight italic">
                &quot;Jewelry is the perfect way to express yourself without saying a word.&quot;
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Typography & Story - Moved Under Image */}
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="mb-6 block font-sans text-xs font-bold tracking-[0.3em] text-primary uppercase">
            Royals and Radiant — Timeless Elegance
          </span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-bold leading-[1.1] text-foreground mb-8">
            Wear Your <span className="italic text-accent">Story</span>
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-xl leading-relaxed text-foreground/80 font-medium mb-12">
            Where tradition meets modern elegance. 
            Discover jewelry that celebrates your unique journey and style.
          </p>
          
          {/* <div className="flex justify-center">
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}>
              <Link 
                href="#products" 
                className="inline-block bg-primary text-primary-foreground px-10 py-4 font-sans text-sm font-bold tracking-widest transition-all hover:bg-primary/90 hover:shadow-xl rounded-full"
              >
                EXPLORE COLLECTION
              </Link>
            </motion.div>
          </div> */}
        </motion.div>
      </div>
    </section>
  );
}
