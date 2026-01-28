"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn btn-outline flex items-center gap-2"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          ☀ <span>Light</span>
        </>
      ) : (
        <>
          🌙 <span>Dark</span>
        </>
      )}
    </button>
  );
}
