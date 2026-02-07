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
    <section className="relative min-h-screen w-full overflow-hidden pt-20">
      <div className="container mx-auto h-full px-4 md:px-8">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Typography & Story */}
          <div className="flex flex-col justify-center lg:col-span-5 lg:py-20 z-10">
             <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
             >
                <span className="mb-6 block font-sans text-xs font-bold tracking-[0.2em] text-primary uppercase">
                   Royals and Radiant — Timeless Elegance
                </span>
                <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] text-foreground">
                   Wear Your <br />
                   <span className="italic text-accent">Story</span>
                </h1>
                <p className="mt-8 max-w-md font-sans text-lg leading-relaxed text-foreground font-medium">
                   Where tradition meets modern elegance. 
                   Discover jewelry that celebrates your unique journey and style.
                </p>
                
                <div className="mt-12 flex items-center gap-8">
                   <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}>
                     <Link 
                        href="#products" 
                        className="group relative overflow-hidden border-b-2 border-primary pb-2 font-sans text-sm font-bold tracking-widest transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                     >
                        EXPLORE COLLECTION
                     </Link>
                   </motion.div>
                </div>
             </motion.div>
          </div>

          {/* Right Column: Carousel Visuals (Feature 1) */}
          <div className="relative flex flex-col justify-center lg:col-span-7">
             <motion.div
                className="relative aspect-[3/4] w-full overflow-hidden bg-secondary md:aspect-[4/5] rounded-2xl shadow-2xl shadow-primary/5"
                initial={shouldReduceMotion ? { opacity: 0 } : { clipPath: 'inset(100% 0 0 0)' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { clipPath: 'inset(0 0 0 0)' }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
             >
                 <AnimatePresence mode="wait">
                    <motion.div
                       key={index}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.8, ease: "easeInOut" }}
                       className="absolute inset-0"
                    >
                       <Image 
                          src={currentImage} 
                          alt={images[index]?.altText || "Royals and Radiant Collection"} 
                          fill 
                          className="object-cover object-center" 
                          priority 
                       />
                    </motion.div>
                 </AnimatePresence>

                 {/* Navigation Dots */}
                 {images.length > 1 && (
                    <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                       {images.map((_, i) => (
                          <button
                             key={i}
                             onClick={() => setIndex(i)}
                             className={`h-2 w-2 rounded-full transition-all ${
                                i === index ? 'w-6 bg-primary' : 'bg-white/50 hover:bg-white'
                             }`}
                          />
                       ))}
                    </div>
                 )}
                 
                 <div className="absolute bottom-8 left-8 max-w-xs backdrop-blur-md bg-white/40 p-6 rounded-xl border border-white/20">
                    <p className="font-display text-xl md:text-2xl text-foreground leading-tight italic">
                        &quot;Jewelry is the perfect way to express yourself without saying a word.&quot;
                    </p>
                 </div>
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
