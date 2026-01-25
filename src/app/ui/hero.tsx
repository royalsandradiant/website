'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-20">
      <div className="container mx-auto h-full px-4 md:px-8">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Typography & Story */}
          <div className="flex flex-col justify-center lg:col-span-5 lg:py-20">
             <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
             >
                <span className="mb-6 block font-sans text-xs font-bold tracking-[0.2em] text-primary">
                   ROYALS AND RADIANT — TIMELESS ELEGANCE
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
                        className="group relative overflow-hidden border-b border-foreground pb-1 font-sans text-sm font-medium tracking-widest transition-colors hover:text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                     >
                        EXPLORE COLLECTION
                     </Link>
                   </motion.div>
                   <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}>
                     <Link 
                        href="/sale" 
                        className="font-sans text-sm font-medium tracking-widest text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                     >
                        VIEW SALE
                     </Link>
                   </motion.div>
                </div>
             </motion.div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative flex flex-col justify-center lg:col-span-7">
             {/* Main Hero Image */}
             <motion.div
                className="relative aspect-3/4 w-full overflow-hidden bg-secondary md:aspect-4/5"
                initial={shouldReduceMotion ? { opacity: 0 } : { clipPath: 'inset(100% 0 0 0)' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { clipPath: 'inset(0 0 0 0)' }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
             >
                 <div className="absolute inset-0 bg-linear-to-br from-[#E8E0D5] via-[#D8D0C5] to-[#C4B8A8]">
                    {/* Decorative Pattern
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-accent/20 to-transparent" />
                    <div className="absolute left-0 bottom-0 h-1/2 w-full bg-gradient-to-t from-primary/5 to-transparent" /> */}
                    <Image src="/hero.png" alt="Royals and Radiant Jewelry Collection" fill className="object-cover object-center" priority />
                 </div>
                 <div className="absolute bottom-8 left-8 max-w-xs backdrop-blur-sm bg-white/30 p-6 rounded-lg">
                    <p className="font-display text-2xl text-foreground">
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
