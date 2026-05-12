/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          light: "#ffffff",
          DEFAULT: "#f7f7f8",
          dark: "#1a1a1d",
          darker: "#0f0f11",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
      },
    },
  },
  plugins: [],
};
