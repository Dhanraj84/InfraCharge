"use client";

import { motion, Variants } from "framer-motion";
import { Zap, MapPin, BarChart3, Search } from "lucide-react";

const features = [
  {
    title: "Real-time tracking",
    description: "Always stay updated with live charging station availability and status across all networks.",
    icon: Zap,
    color: "rgba(255, 77, 79, 0.4)",
  },
  {
    title: "Smart route optimization",
    description: "Plan long trips with intelligent stop suggestions based on your battery level and real-time traffic.",
    icon: BarChart3,
    color: "rgba(255, 77, 79, 0.4)",
  },
  {
    title: "Where to build EV station",
    description: "Analyze demand, traffic, charger gaps & amenities to pick the right spot with data-driven precision.",
    icon: MapPin,
    color: "rgba(255, 77, 79, 0.4)",
  },
  {
    title: "Nearby discovery",
    description: "Discover the best charging spots near you with details on pricing, speed, and surrounding amenities.",
    icon: Search,
    color: "rgba(255, 77, 79, 0.4)",
  },
];


const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export default function Features() {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-text mb-4"
          >
            Everything you need for the <span className="text-primary italic">Electric Lifestyle</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            InfraCharge provides a comprehensive suite of tools designed to make EV charging seamless, efficient, and data-driven.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02, 
                // Sharper, tighter glow to match the "How it Works" circles
                boxShadow: `0 0 20px 2px ${feature.color.replace('0.4', '0.6')}`,
                borderColor: feature.color.replace('0.4', '0.8'),
              }}
              className="relative p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border-2 border-white/10 transition-all duration-500 group cursor-default"
            >

              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"

                style={{ backgroundColor: feature.color }}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-text mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted leading-relaxed">
                {feature.description}
              </p>
              
            </motion.div>

          ))}
        </div>
      </div>
      
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />
    </section>
  );
}
