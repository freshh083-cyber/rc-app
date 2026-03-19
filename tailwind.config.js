/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rc: {
          teal: '#0D9488',
          navy: '#1B2A4A',
          light: '#F0FDF9',
        }
      }
    }
  },
  plugins: [],
}
