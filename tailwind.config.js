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
        sans: ['Poppins', 'system-ui', 'sans-serif'], // Main font - change 'Inter' to any Google Font
        // Alternative options:
        // sans: ['Poppins', 'system-ui', 'sans-serif'],
        // sans: ['Roboto', 'system-ui', 'sans-serif'],
        // sans: ['Open Sans', 'system-ui', 'sans-serif'],
        // sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      
      // CHANGE YOUR COLORS HERE
      colors: {
        // Primary color (currently emerald/green) - used for buttons, headers, accents
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',  // Main primary color
          600: '#059669',  // Hover states
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        
        // Secondary color (currently gold/yellow) - used for accents, badges
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Main secondary color
          600: '#ca8a04',  // Hover states
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        
        // You can also use preset Tailwind colors:
        // Just replace 'primary' throughout the app with any of these:
        // - emerald (current green)
        // - blue
        // - indigo
        // - purple
        // - pink
        // - red
        // - orange
        // - amber
        // - lime
        // - teal
        // - cyan
        // - sky
      },
    },
  },
  plugins: [],
}