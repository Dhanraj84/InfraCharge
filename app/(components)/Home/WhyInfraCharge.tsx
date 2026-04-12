"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Globe } from "lucide-react";

const reasons = [
  {
    title: "Faster discovery",
    description: "Our proprietary search algorithm finds the best charging stations in milliseconds, not minutes.",
    icon: Zap,
  },
  {
    title: "Real-time data",
    description: "Connect directly to network provider APIs for 100% accurate status updates every minute.",
    icon: ShieldCheck,
  },
  {
    title: "Built for EV future",
    description: "Scaling with the global EV infrastructure, our platform supports next-gen chargers and V2G.",
    icon: Globe,
  },
];

export default function WhyInfraCharge() {
  return (
    <section id="why-infracharge" className="py-24 bg-bg/50 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-text mb-4"
          >
            Why <span className="text-primary">InfraCharge?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            We're building more than just an app; we're building the infrastructure that powers the electric revolution.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                boxShadow: "0 0 20px 2px rgba(255, 77, 79, 0.6)",
                borderColor: "rgba(255, 77, 79, 0.8)",
              }}
              className="p-8 md:p-12 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border-2 border-white/10 transition-all duration-500 group cursor-default relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-bg border border-white/10 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors duration-300">
                  <reason.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-text mb-4 group-hover:text-primary transition-colors duration-300">
                  {reason.title}
                </h3>
                <p className="text-muted text-lg leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
