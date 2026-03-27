"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LocationButton from "./LocationButton";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { name: "About Us", href: "/about" },
  { name: "Select Vehicle", href: "/select-vehicle" },
  { name: "Contact Us", href: "/contact" },
  { name: "Assist Network", href: "/assist" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-[9999] transition-all duration-300 backdrop-blur-md border-b ${
          scrolled
            ? "bg-black/95 border-border py-3 shadow-md"
            : "bg-black/85 border-border py-4 shadow-sm"
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 group z-50">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">⚡</span>
          <span className="font-extrabold text-xl tracking-wide text-infra">
            InfraCharge
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center text-sm font-medium transition-colors duration-300 ease-in-out ${
                  isActive ? "text-infra" : "text-text"
                } after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-infra after:transition-all after:duration-300 after:ease-in-out ${
                  isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth & Location Actions */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <LocationButton />
          
          {user ? (
            <div className="relative group">
              <button className="w-10 h-10 rounded-full overflow-hidden border border-border bg-card shadow-sm hover:border-infra transition-colors flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-infra text-white font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* HOVER DROPDOWN */}
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 overflow-hidden">
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-sm text-text hover:bg-muted/30 transition-colors"
                >
                  Update Profile
                </Link>

                <button
                  onClick={() => signOut(auth)}
                  className="block w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="px-5 py-2 rounded-xl border border-infra text-infra text-sm font-medium hover:bg-infra hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,77,79,0)] hover:shadow-[0_0_15px_rgba(255,77,79,0.3)]">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle & Auth (For Phones) */}
        <div className="flex lg:hidden items-center gap-3">
           <div className="sm:hidden"><LocationButton /></div>
           <button 
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className="p-2 text-text hover:text-infra transition-colors rounded-lg bg-white/5 border border-border/50"
             aria-label="Toggle Menu"
           >
             {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
           </button>
        </div>
      </div>

      </header>

      {/* MOBILE MENU DROPDOWN (OUTSIDE HEADER TO PREVENT COMPOSITING BUG) */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed top-[70px] left-0 w-full h-[calc(100vh-70px)] bg-[#0A0A0A] overflow-y-auto animate-in slide-in-from-top-2 duration-300 z-[99999]"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <nav className="flex flex-col px-4 py-6 space-y-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl font-bold text-lg ${isActive ? 'bg-infra/10 text-infra border border-infra/20' : 'text-text hover:bg-white/5'}`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-border mt-2 space-y-3">
               {user ? (
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-3 px-4 py-2 border border-border rounded-xl bg-bg">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-border" />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center bg-infra rounded-full text-white font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</div>
                      )}
                      <span className="text-sm font-medium text-text truncate">{user.email}</span>
                   </div>
                   <Link href="/profile" className="w-full text-center px-4 py-3 bg-white/5 rounded-xl font-bold text-text hover:bg-white/10 transition-colors">Profile</Link>
                   <button onClick={() => signOut(auth)} className="w-full px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-colors">Logout</button>
                 </div>
               ) : (
                 <Link href="/login" className="block w-full text-center px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg">
                   Login / Sign Up
                 </Link>
               )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
