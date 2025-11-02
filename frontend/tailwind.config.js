/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use a clean, modern font
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-indigo': '#4f46e5',
        'secondary-gray': '#f9fafb',
      }
    },
  },
  plugins: [],
}
