"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import HeroSection from "./(components)/HeroSection";
import Features from "./(components)/Home/Features";
import HowItWorks from "./(components)/Home/HowItWorks";
import Stats from "./(components)/Home/Stats";
import WhyInfraCharge from "./(components)/Home/WhyInfraCharge";

export default function Home() {
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="bg-bg min-h-screen">
      <HeroSection />

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 md:space-y-32 pb-24">
        
        {/* 1. Features Section (NEW) */}
        <Features />

        {/* 2. How It Works Section (NEW) */}
        <HowItWorks />

        {/* 1. Where to Build EV Stations (PROMOTED & UPGRADED) */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-10"
        >

          <div className="space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="space-y-4">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">Analytics Engine</span>
              <h3 className="text-4xl md:text-5xl font-extrabold text-text tracking-tight leading-tight">
                Where to <span className="text-primary italic">Build</span> EV Stations?
              </h3>
              <p className="text-muted text-lg md:text-xl leading-relaxed max-w-lg mx-auto md:mx-0">
                Harness the power of data. Analyze demand clusters, traffic patterns, and existing gaps to maximize your charging network's ROI.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
              <Link href="/where-to-build" className="btn btn-primary px-10 py-5 text-xl rounded-2xl shadow-[0_15px_30px_rgba(255,77,79,0.25)] hover:-translate-y-2 transition-all duration-300">
                Let's Go →
              </Link>
            </div>
          </div>

          <div className="relative rounded-[2.5rem] p-4 bg-white/5 border border-white/10 overflow-hidden group-hover:shadow-[0_0_50px_rgba(255,77,79,0.2)] transition-all duration-500">
            <video
              src="/build-ev.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full rounded-[2.2rem] object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
            />
            {/* Inner gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
          </div>
        </motion.section>

        {/* 2. Route Planner (MIDDLE - OFFSET UPGRADE) */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-10"
        >
          <div className="relative order-2 md:order-1 group">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <video
              className="relative z-10 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-500/30 hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-700"
              src="/route.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
          
          <div className="space-y-8 order-1 md:order-2 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="space-y-4">
              <span className="text-blue-400 font-bold tracking-widest uppercase text-sm">Smart Navigation</span>
              <h3 className="text-4xl md:text-5xl font-extrabold text-text tracking-tight leading-tight">
                Plan Intelligent <span className="text-blue-400 italic">EV Routes</span>
              </h3>
              <p className="text-muted text-lg md:text-xl leading-relaxed mx-auto md:mx-0">
                Stay ahead with live traffic, real-time weather monitoring, and precision battery forecasting for a seamless cross-country experience.
              </p>
            </div>
            
            <Link href="/route-planner" className="btn btn-outline border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white px-10 py-5 text-xl rounded-2xl w-full sm:w-fit text-center transition-all duration-300">
              Start Planning →
            </Link>
          </div>
        </motion.section>

        {/* 3. Find Nearest Charging Station (BOTTOM - CLEAN UI) */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-10"
        >
          <div className="space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="space-y-4">
               <span className="text-primary font-bold tracking-widest uppercase text-sm">Location Services</span>
              <h3 className="text-4xl md:text-5xl font-extrabold text-text tracking-tight leading-tight">
                Nearest <span className="text-primary italic">Stations</span> Finder
              </h3>
              <p className="text-muted text-lg md:text-xl leading-relaxed mx-auto md:mx-0">
                Connect instantly with the grid. Auto-detect your location and access real-time occupancy, pricing, and high-speed amenities.
              </p>
            </div>
            
            <Link href="/find-charging" className="btn btn-outline border-primary/40 text-primary hover:bg-primary hover:text-white px-10 py-5 text-xl rounded-2xl w-full sm:w-fit text-center transition-all duration-300">
              Let's Go →
            </Link>
          </div>

          <div className="relative group overflow-hidden">
            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/5 group-hover:border-primary/30 transition-all duration-500">
              <video
                src="/Nearest.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.section>


        {/* 6. CO2 Savings Section (EXISTING - IMPROVED UI) */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center space-y-8 bg-gradient-to-b from-transparent via-primary/5 to-transparent py-20 rounded-[3rem]"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <h3 className="text-4xl md:text-5xl font-extrabold text-text">
              Your CO₂ Savings
            </h3>
            <p className="text-lg md:text-xl text-muted">
              Discover your environmental impact. See how much carbon you save and how much money stays in your pocket by going electric.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/co2-savings" className="btn btn-primary px-10 py-5 text-xl rounded-2xl w-full sm:w-auto shadow-[0_10px_30px_rgba(255,77,79,0.3)]">
                Calculate Impact →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* 7. Stats Section (NEW) */}
        <Stats />

        {/* 8. Why InfraCharge Section (NEW) */}
        <WhyInfraCharge />

        {/* ========== FOOTER ========= */}
        <footer className="text-center pt-20 border-t border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-bold text-primary tracking-widest uppercase">InfraCharge</div>
            <p className="text-muted">© 2026 InfraCharge • Shaping the Future of Electric Mobility</p>
            <p className="text-xs text-muted/50 mb-10">Built with ❤️ by Dhanraj 🚀</p>
          </div>
        </footer>

      </div>
    </div>
  );
}