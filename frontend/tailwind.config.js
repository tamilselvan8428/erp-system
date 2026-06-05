/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F57A3',
          dark: '#153E75',
          light: '#EAF3FF',
        },
        accent: {
          DEFAULT: '#ECBF19',
          light: '#FFF6D5',
        },
        bg: '#F5F7FA',
        success: '#28A745',
        warning: '#FF9800',
        danger: '#DC3545',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
