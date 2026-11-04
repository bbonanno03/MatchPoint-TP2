/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mantenemos la paleta de colores de MatchPoint que definimos
        brand: {
          light: "#ccff00",
          DEFAULT: "#15803d",
          dark: "#166534",
        },
        surface: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
        },
        status: {
          active: "#22c55e",
          cancelled: "#ef4444",
          completed: "#3b82f6",
        },
        // Definimos un negro específico si querés usar bg-black-800
        black: {
          800: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Impact", "Trebuchet MS", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        premium:
          "0 10px 15px -3px rgba(21, 128, 61, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [],
};
