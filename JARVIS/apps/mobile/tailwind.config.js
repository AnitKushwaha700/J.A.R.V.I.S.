/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        card: '#111827',
        border: '#1f293d',
        primary: {
          DEFAULT: '#38bdf8',
          dark: '#0284c7',
        },
        secondary: '#64748b',
        accent: '#818cf8',
        neon: '#00f2fe',
      },
    },
  },
  plugins: [],
};
