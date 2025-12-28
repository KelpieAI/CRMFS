/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // CHANGE YOUR FONTS HERE
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'], // Main font - change 'Inter' to any Google Font
        // Alternative options:
        // sans: ['Poppins', 'system-ui', 'sans-serif'],
        // sans: ['Roboto', 'system-ui', 'sans-serif'],
        // sans: ['Open Sans', 'system-ui', 'sans-serif'],
        // sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      
      // CHANGE YOUR COLORS HERE
      colors: {
        // Islamic Green - Primary
        'mosque-green': {
          50: '#e6f2e8',
          100: '#c0dfc5',
          200: '#96ca9e',
          300: '#6cb577',
          400: '#4da459',
          500: '#2e943c',  // Mid green
          600: '#06420c',  // Dad's requested green - MAIN COLOR
          700: '#053a0a',
          800: '#043208',
          900: '#032506',
        },

        // Mosque Gold - Secondary
        'mosque-gold': {
          50: '#fef9e7',
          100: '#fcefc2',
          200: '#f9e599',
          300: '#f7da70',
          400: '#f5d151',
          500: '#f3c832',
          600: '#D4AF37',  // Dad's requested gold - MAIN COLOR
          700: '#b8952d',
          800: '#9c7c23',
          900: '#80631a',
        },

        // Keep existing primary/secondary for backwards compatibility
        primary: {
          50: '#e6f2e8',
          100: '#c0dfc5',
          200: '#96ca9e',
          300: '#6cb577',
          400: '#4da459',
          500: '#2e943c',
          600: '#06420c',  // Islamic green
          700: '#053a0a',
          800: '#043208',
          900: '#032506',
        },

        secondary: {
          50: '#fef9e7',
          100: '#fcefc2',
          200: '#f9e599',
          300: '#f7da70',
          400: '#f5d151',
          500: '#f3c832',
          600: '#D4AF37',  // Mosque gold
          700: '#b8952d',
          800: '#9c7c23',
          900: '#80631a',
        },
      },
    },
  },
  plugins: [],
}