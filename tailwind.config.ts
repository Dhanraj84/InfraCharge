import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* 🔗 CONNECT TAILWIND TO globals.css */
      colors: {
        /* Backgrounds */
        bg: "var(--bg-main)",
        card: "var(--bg-card)",

        /* Text */
        text: "var(--text-main)",
        muted: "var(--text-muted)",

        /* Borders */
        border: "var(--border-color)",

        /* Brand / Primary color */
        primary: "var(--infracharge-red)",
        infra: "var(--infracharge-red)",
      },

      /* Optional glow (if needed later) */
      boxShadow: {
        glowPrimary: "0 0 18px rgba(255, 77, 79, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
