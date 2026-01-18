/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif', '"Noto Serif SC"'],
        serif: ['ui-serif', 'Georgia', 'serif', '"Noto Serif SC"'],
      },
      typography: {
        DEFAULT: {
          css: {
            'pre:has(.mermaid-diagram)': {
              backgroundColor: 'transparent !important',
              padding: 0,
              boxShadow: 'none',
            },
          }
        }
      }
    },
  },
  plugins: [
    typography,
  ],
};