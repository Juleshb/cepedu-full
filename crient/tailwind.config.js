/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        // WhatsApp-like single sans (Figtree ≈ WhatsApp Sans Var proportions)
        display: [
          'Figtree',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'Figtree',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          DEFAULT: '#1B4D3E',
          dark: '#14382E',
          light: '#2A6B56',
          muted: '#D8E6E0',
        },
        accent: {
          DEFAULT: '#C4A35A',
          soft: '#E8D9B0',
        },
        stone: {
          page: '#FCF5EB',
          panel: '#FFFCF7',
          line: '#E8E2D6',
          ink: '#1C1E21',
          mute: '#5E5E5E',
        },
        secondary: '#F3F0EA',
        textcol: '#6B6560',
      },
      animation: {
        slide: 'slide 25s linear infinite',
      },
      keyframes: {
        slide: {
          '0%, 100%': { transform: 'translateX(5%)' },
          '50%': { transform: 'translateX(-120%)' },
        },
      },
      backgroundImage: {
        'paper-grain':
          'radial-gradient(ellipse at 20% 20%, rgba(196,163,90,0.10), transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(27,77,62,0.08), transparent 45%), linear-gradient(165deg, #FCF5EB 0%, #F7F0E4 48%, #EEF3F0 100%)',
        'auth-wash':
          'linear-gradient(135deg, rgba(20,56,46,0.88) 0%, rgba(27,77,62,0.72) 45%, rgba(26,26,24,0.55) 100%)',
      },
    },
  },
  plugins: [],
};
