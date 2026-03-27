import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/(components)/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* 🔗 Connect Tailwind to CSS variables (globals.css) */
      colors: {
        /* Backgrounds */
        bg: "var(--bg-main)",
        card: "var(--bg-card)",

        /* Text */
        text: "var(--text-main)",
        muted: "var(--text-muted)",

        /* Borders */
        border: "var(--border-color)",

        /* Brand */
        primary: "var(--infracharge-red)",
        infra: "var(--infracharge-red)",
      },

      /* Optional glow effect */
      boxShadow: {
        glowPrimary: "0 0 18px rgba(255, 77, 79, 0.45)",
      },
      animation: {
        'gradient-x': 'gradient-x 4s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
