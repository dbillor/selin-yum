
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','Inter','Helvetica','Arial','Apple Color Emoji','Segoe UI Emoji']
      }
    },
  },
  plugins: [],
}
