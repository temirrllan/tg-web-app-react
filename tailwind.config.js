/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'habit-green': '#66D964',
        'habit-blue': '#007AFF',
        'habit-gray': '#8E8E93',
        'habit-bg': '#F2F2F7',
      }
    },
  },
  plugins: [],
}