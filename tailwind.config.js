/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f0fb',
          100: '#ecddf7',
          200: '#d4b3ef',
          300: '#b882e3',
          400: '#9a55d4',
          500: '#7c35bf',
          600: '#6120a3',
          700: '#4e108a',
          800: '#3B0764',
          900: '#270444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
