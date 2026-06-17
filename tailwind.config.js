/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#fafafa',
        border: '#e4e4e7',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

