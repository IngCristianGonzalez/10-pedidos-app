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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          orange: "#FF6B00",
          "orange-light": "#FF8C32",
          "orange-dark": "#E55F00",
          black: "#0A0A0A",
          dark: "#1A1A1A",
          gray: "#2A2A2A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
