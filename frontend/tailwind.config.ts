import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f0f",
        surface: "#1a1a1a",
        "surface-2": "#222222",
        border: "#2a2a2a",
        accent: "#6366f1",
        "accent-hover": "#4f52d9",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        text: {
          primary: "#f5f5f5",
          muted: "#9ca3af",
          subtle: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
