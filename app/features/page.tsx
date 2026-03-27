"use client";

import { motion } from "framer-motion";
import { 
  Map, 
  Zap, 
  Calculator, 
  BarChart, 
  CloudRain, 
  Car, 
  Settings, 
  Activity, 
  TrendingUp 
} from "lucide-react";

const features = [
  { title: "Smart EV Route Planner", desc: "Real-time traffic, weather, battery usage & charging stops." },
  { title: "Nearest Charging Station Finder", desc: "Live details, station type, amenities, and distance." },
  { title: "Cost & Energy Calculator", desc: "Charging cost, energy, time, and fuel savings." },
  { title: "EV Station Site Analyzer", desc: "Traffic, population, charger gaps & amenities into a score." },
  { title: "Weather-Aware Efficiency", desc: "Heat/cold/rain impacts on range & performance." },
  { title: "Live Traffic Integration", desc: "Avoid slow routes & predict battery usage better." },
  { title: "Select Your EV Model", desc: "Load specs or enter manually if not listed." },
  { title: "Custom EV Support", desc: "Manual entry adjusts all tools automatically." },
  { title: "EV Insights & Analytics", desc: "Energy, CO₂ savings, adoption data & stats." },
];

const icons = [Map, Zap, Calculator, BarChart, CloudRain, Car, Settings, Activity, TrendingUp];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Features() {
  return (
    <div className="relative min-h-screen py-20 px-6 overflow-hidden bg-bg">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-red-400 dark:via-red-500 dark:to-orange-400">
            Our Features
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto opacity-80 leading-relaxed font-medium">
            Discover the powerful tools and data-driven insights we provide for the ultimate electric vehicle experience.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div 
                key={f.title} 
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(255,77,77,0.3)] dark:hover:shadow-[0_0_20px_rgba(255,77,77,0.2)] transition-all duration-300 overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-500/10 dark:bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 dark:group-hover:bg-red-500/20 transition-all duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/40 flex items-center justify-center mb-5 text-red-600 dark:text-red-400 group-hover:scale-110 group-hover:text-red-700 dark:group-hover:text-red-500 transition-all duration-300 shadow-sm border border-white/20 dark:border-white/5">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-text tracking-tight">{f.title}</h3>
                  <p className="opacity-80 text-sm text-muted flex-grow leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
