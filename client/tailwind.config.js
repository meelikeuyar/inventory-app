/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#deeeff',
          200: '#c4e0ff',
          300: '#98cbff',
          400: '#5eaaff',
          500: '#3889e6',
          600: '#1f6fd0',
          700: '#185aaa',
          800: '#194b8c',
          900: '#1a4073',
          950: '#122a4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
