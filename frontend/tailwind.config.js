/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest:  '#060f1a',
          dark:     '#0d2137',
          mid:      '#0a3d62',
          blue:     '#1b4f72',
          accent:   '#2e86c1',
          light:    '#85c1e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Calibri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
