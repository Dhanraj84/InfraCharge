"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/features');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0px", "-100px"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={containerRef} className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-bg">
      {/* Background Gradient & Zoom */}
      <motion.div 
        style={{ scale: bgScale }}
        className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#020205] via-[#090b14] to-[#000000] dark:from-[#05050f] dark:via-[#0b0b1a] dark:to-[#000000] light:from-slate-50 light:via-slate-100 light:to-white z-0"
      >
        {/* Subtle layer for styling */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
        {/* Glowing Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-infra/10 blur-[120px] rounded-full pointer-events-none"></div>
      </motion.div>

      {/* Content wrapper with scroll parallax */}
      <motion.div 
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto mt-16"
      >
        {/* Entrance Animation Context */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative"
        >
          {/* Subtle glowing blur directly behind heading */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff6a5c] to-[#ff9a8b] blur-3xl opacity-20 transform scale-110 rounded-[100px]" />
          
          <h1 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.15] tracking-tight mb-6 py-2">
            Powering India’s
            <br />
            <span>
              Electric Future
            </span>
          </h1>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-muted max-w-3xl mb-10 font-medium leading-relaxed"
        >
Smart Tools For EV Owners, Buiseness, And Planners        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto mt-4"
        >
          <div>
            <button 
              onClick={handleFeaturesClick}
              className="px-8 py-3 w-full sm:w-auto text-sm sm:text-base font-medium text-white bg-transparent border border-white/10 rounded-full hover:border-white/30 hover:bg-white/5 transition-all duration-300"
            >
              View Features
            </button>
          </div>
        </motion.div>
      </motion.div>


    </section>
  );
}
