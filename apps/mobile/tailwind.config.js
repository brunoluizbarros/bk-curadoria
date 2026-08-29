/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // mesmas cores da marca de apps/web/src/app/globals.css
        cream: { DEFAULT: "#EFE8DC", soft: "#F5F0E6", deep: "#E5DCC8" },
        terracotta: { DEFAULT: "#B8634A", soft: "#D88068" },
        gold: { DEFAULT: "#C9A063", soft: "#D9B47A" },
        sage: { DEFAULT: "#6A7256", deep: "#4F5841", light: "#8A9476" },
        ink: { DEFAULT: "#2A2722", soft: "#5C564E" },
      },
    },
  },
  plugins: [],
};
