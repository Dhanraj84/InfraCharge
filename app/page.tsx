"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import HeroSection from "./(components)/HeroSection";

export default function Home() {
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <HeroSection />

      {/* ================= MAIN CONTENT ================= */}
      <div id="features" className="max-w-7xl mx-auto space-y-16 md:space-y-24 px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-bg">

        {/* ========== JOURNEY OF INNOVATION ========= */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center"
        >
          <div className="space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold text-text">
              Our Journey of Innovation
            </h2>
            <p className="text-muted">
              From smart route planning to real-time EV analytics, InfraCharge is shaping the future
              of electric mobility with data-driven insights, intelligent tools, and a commitment to
              sustainable innovation.
            </p>
          </div>

          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-2 hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] hover:scale-[1.02] transition-all duration-300">
            <Image
              src="/timeline.png"
              width={1200}
              height={700}
              alt="Timeline"
              className="rounded-2xl"
            />
          </div>
        </motion.section>

        {/* ========== ROUTE PLANNER CTA ========= */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center"
        >
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
              Plan intelligent EV routes
            </h3>
            <p className="text-muted">
              Live traffic, weather, battery usage, charging stops & savings.
            </p>
            <Link href="/route-planner" className="btn btn-primary w-full sm:w-fit text-center">
              Let’s Go →
            </Link>
          </div>

          <video
            className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] hover:scale-[1.02] transition-all duration-300"
            src="/route.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </motion.section>

        {/* ========== WHERE TO BUILD ========= */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center"
        >
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
              Where to build EV stations
            </h3>
            <p className="text-muted">
              Analyze demand, traffic, charger gaps & amenities to pick the right spot.
            </p>
            <Link href="/where-to-build" className="btn btn-primary w-full sm:w-fit text-center">
              Let's Go →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 overflow-hidden hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] hover:scale-[1.02] transition-all duration-300">
            <video
              src="/build-ev.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
        </motion.section>

        {/* ========== FIND NEAREST ========= */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center"
        >
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
              Find nearest charging station
            </h3>
            <p className="text-muted">
              Auto-detect your location, filter by connector, price & amenities.
            </p>
            <Link href="/find-charging" className="btn btn-primary w-full sm:w-fit text-center">
              Let’s Go →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] hover:scale-[1.02] transition-all duration-300">
            <video
              src="/Nearest.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
        </motion.section>

        {/* ========== CO2 SAVINGS ========= */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center space-y-5"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
            Your CO₂ Savings
          </h3>
          <p className="text-sm sm:text-base text-muted">
            See how much carbon & money you save by going electric.
          </p>
          <Link href="/co2-savings" className="btn btn-primary w-full sm:w-auto">
            Calculate Now →
          </Link>
        </motion.section>

        {/* ========== FOOTER ========= */}
        <footer className="text-center text-muted pt-10 border-t border-border">
          © 2026 InfraCharge • Built by Dhanraj 🚀
        </footer>

      </div>
    </>
  );
}