"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import LocationButton from "./LocationButton";

export default function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

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
<Link href="/assist" className="hover:text-infra transition">
  Assist Network
</Link>
          {/* AUTH SECTION */}
{user ? (
  <div className="relative group">
    <button className="w-10 h-10 rounded-full overflow-hidden border border-infra">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-infra text-white font-bold">
          {user.email?.charAt(0).toUpperCase()}
        </div>
      )}
    </button>

    {/* HOVER DROPDOWN */}
    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50">
      <Link
        href="/profile"
        className="block px-4 py-2 hover:bg-muted"
      >
        Update Profile
      </Link>

      <button
        onClick={() => signOut(auth)}
        className="block w-full text-left px-4 py-2 hover:bg-muted"
      >
        Logout
      </button>
    </div>
  </div>
) : (
  <Link href="/login" className="btn btn-outline">
    Login / Signup
  </Link>
)}

          <ThemeToggle />
          <LocationButton />
        </nav>
      </div>
    </header>
  );
}