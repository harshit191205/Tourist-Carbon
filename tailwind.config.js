/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#020617",
          surface: "#020617",
          card: "#0f172a",
          border: "#1f2937",
        },
        eco: {
          primary: "#22c55e",
          light: "#4ade80",
        },
        accent: {
          blue: "#38bdf8",
          yellow: "#facc15",
          red: "#ef4444",
        },
        text: {
          primary: "#e5e7eb",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
