/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crou: {
          orange: '#FF6B00',
          green: '#008751',
          gold: '#FBBF24',
          dark: '#111827',
          light: '#F9FAFB',
        }
      }
    },
  },
  plugins: [],
}
