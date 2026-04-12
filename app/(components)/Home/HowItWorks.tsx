"use client";

import { motion } from "framer-motion";
import { MapPin, Search, Navigation } from "lucide-react";

const steps = [
  {
    title: "Enable Location",
    description: "Grant location access to find the nearest charging points instantly.",
    icon: MapPin,
  },
  {
    title: "Discover Stations",
    description: "Browse through available stations with filters for speed and price.",
    icon: Search,
  },
  {
    title: "Navigate & Charge",
    description: "Get turn-by-turn directions and start charging your EV with ease.",
    icon: Navigation,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-text mb-6 uppercase tracking-wider"
          >
            How it <span className="text-primary italic">Works</span>
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100px" }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-1 bg-primary mx-auto rounded-full"
          />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[2px] bg-white/10 -z-10">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary origin-left"
            />
          </div>

          {/* Connecting Line (Mobile) */}
          <div className="md:hidden absolute left-1/2 top-[50px] bottom-[100px] w-[2px] bg-white/10 -translate-x-1/2 -z-10">
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-b from-primary via-blue-500 to-primary origin-top"
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-bg border-4 border-white/5 flex items-center justify-center mb-8 relative z-10 transition-all duration-500 group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(255,77,79,0.3)]">
                <div className="absolute inset-2 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors duration-500" />
                <step.icon className="w-10 h-10 text-white group-hover:text-primary transition-colors duration-500" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text mb-4 transition-colors duration-300 group-hover:text-primary">
                {step.title}
              </h3>
              <p className="text-muted text-lg max-w-xs mx-auto leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
