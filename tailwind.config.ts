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
        accent: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        coral: {
          50: "#fff5f3",
          100: "#ffe8e4",
          200: "#ffd5cc",
          300: "#ffb5a6",
          400: "#ff8b73",
          500: "#FF6B4A",
          600: "#ed4a26",
          700: "#c73a1a",
          800: "#a33319",
          900: "#87301b",
        },
        stone: {
          50: "#FAFAF8",
          100: "#F5F5F3",
          200: "#E8E8E4",
          300: "#D4D4CE",
          400: "#A3A398",
          500: "#737368",
          600: "#545449",
          700: "#3D3D35",
          800: "#282822",
          900: "#1A1A16",
          950: "#0D0D0A",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "expand-full": "expandFull 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        expandFull: {
          "0%": {
            transform: "scale(1)",
            borderRadius: "1.5rem",
          },
          "100%": {
            transform: "scale(1)",
            borderRadius: "0",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-12deg)" },
          "50%": { transform: "translateY(-10px) rotate(-12deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
