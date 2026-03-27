"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  return (
    <main 
      className={`flex-1 w-full ${
        isHome ? "" : "px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-16 max-w-7xl mx-auto"
      }`}
    >
      {children}
    </main>
  );
}
