"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 rounded-lg border px-4 py-2"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          ☀️ <span>Light</span>
        </>
      ) : (
        <>
          🌙 <span>Dark</span>
        </>
      )}
    </button>
  );
}
