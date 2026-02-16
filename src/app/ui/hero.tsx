'use client';

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import type { HeroImage } from '@/app/lib/definitions';

export function Hero({ images }: { images: HeroImage[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  const activeImages = useMemo(() => {
    const mobileImages = images.filter((image) => image.viewport === 'mobile');
    const desktopImages = images.filter((image) => image.viewport !== 'mobile');

    if (isMobileViewport) {
      return mobileImages.length > 0 ? mobileImages : desktopImages;
    }
    return desktopImages.length > 0 ? desktopImages : mobileImages;
  }, [images, isMobileViewport]);

  useEffect(() => {
    if (index < activeImages.length) return;
    setIndex(0);
  }, [activeImages.length, index]);

  // Auto-scroll logic (Feature 1)
  useEffect(() => {
    if (activeImages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeImages]);

  const currentImage =
    activeImages.length > 0 ? activeImages[index].imageUrl : '/hero.png';

  return (
    <section className="relative w-full overflow-hidden pt-16">
      {/* Full Size Image Container */}
      <div className="relative h-[45dvh] w-full overflow-hidden sm:h-[55dvh] md:h-[65dvh] lg:h-[72dvh] xl:h-[80dvh]">
        <motion.div
          className="relative h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
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
                alt={activeImages[index]?.altText || "Royals and Radiant Collection"} 
                fill 
                className="object-cover object-center" 
                priority 
                sizes="100vw"
              />
              {/* Overlay for better text contrast if needed later */}
              <div className="absolute inset-0 bg-black/5" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          {activeImages.length > 1 && (
            <div className="absolute bottom-5 right-5 z-20 flex gap-3 sm:bottom-10 sm:right-10">
              {activeImages.map((image, i) => (
                <button
                  type="button"
                  key={image.id}
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
            <div className="absolute bottom-6 left-4 right-4 max-w-xs rounded-xl border border-white/20 bg-white/30 p-4 backdrop-blur-md sm:bottom-12 sm:left-12 sm:right-auto sm:p-6">
              <p className="font-display text-lg italic leading-tight text-foreground md:text-2xl">
                &quot;Jewelry is the perfect way to express yourself without saying a word.&quot;
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Typography & Story - Moved Under Image */}
      <div className="container mx-auto px-4 py-16 md:px-8 md:py-24">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="mb-6 block font-sans text-xs font-bold tracking-[0.3em] text-primary uppercase">
            Royals and Radiant — Timeless Elegance
          </span>
          <h1 className="mb-8 text-balance font-display text-5xl font-bold leading-[1.1] text-foreground sm:text-6xl md:text-8xl">
            Wear Your <span className="italic text-accent">Story</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-pretty font-sans text-lg font-medium leading-relaxed text-foreground/80 md:text-xl">
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
