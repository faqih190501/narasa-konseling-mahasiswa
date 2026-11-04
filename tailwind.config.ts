import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          50: "#f0f9f8",
          100: "#d8f0ed",
          200: "#b5e1dc",
          300: "#85cbc4",
          400: "#54aea7",
          500: "#39928c",
          600: "#2b7571",
          700: "#265f5c",
          800: "#224c4a",
          900: "#20403f",
        },
        serene: {
          50: "#f2f7fc",
          100: "#e1eef8",
          200: "#cbe1f3",
          300: "#a7cdeb",
          400: "#7db2e0",
          500: "#5d95d5",
          600: "#497bc8",
          700: "#3e67b7",
          800: "#375595",
          900: "#314977",
        },
      },
    },
  },
  plugins: [],
};
export default config;

