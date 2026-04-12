"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

function Counter({ value, suffix = "", title }: { value: number; suffix?: string; title: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 100,
    damping: 50,
  });
  
  const displayValue = useTransform(spring, (current) => Math.round(current));
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    return displayValue.onChange((v) => setCurrentValue(v));
  }, [displayValue]);

  return (
    <div ref={ref} className="text-center p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-primary mb-2 tabular-nums">
          {currentValue}
          {suffix}
        </div>
        <div className="text-muted text-base md:text-lg font-medium uppercase tracking-widest">{title}</div>
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="py-20 bg-bg">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <Counter value={500} suffix="+" title="Charging Stations" />
          <Counter value={1000} suffix="+" title="Active Users" />
          <Counter value={99} suffix="%" title="Uptime Guaranteed" />
        </div>
      </div>
    </section>
  );
}
