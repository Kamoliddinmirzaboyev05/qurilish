import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F172A",
          primary: "#155E95",
          primaryHover: "#0F4C7A",
          teal: "#0F766E",
          amber: "#D97706",
        },
        surface: {
          page: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
} satisfies Config;
