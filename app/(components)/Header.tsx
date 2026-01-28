"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header
      className="
        sticky top-0 z-40
        backdrop-blur
        bg-card/80
        border-b border-border
        transition-colors duration-300
      "
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl text-infra">
            InfraCharge
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-text">
          <Link href="/about" className="hover:text-infra transition">
            About Us
          </Link>
          <Link href="/features" className="hover:text-infra transition">
            Features
          </Link>
          <Link href="/select-vehicle" className="hover:text-infra transition">
            Select Vehicle
          </Link>
          <Link href="/contact" className="hover:text-infra transition">
            Contact Us
          </Link>

          <Link href="/login" className="btn btn-outline">
            Login / Signup
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
