import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Energetic Fitness — orange is the star.
        brand: {
          DEFAULT: '#FF5A1F',
          hover: '#E64A12',
          tint: '#FFF1EC',
          50: '#FFF1EC',
          100: '#FFE0D3',
          200: '#FFC1A6',
          300: '#FF9E73',
          400: '#FF7A45',
          500: '#FF5A1F',
          600: '#E64A12',
          700: '#BF3A0E',
          800: '#992F0E',
          900: '#7A2810'
        },
        // Lime — a garnish accent. Tailwind's built-in lime ramp already matches
        // (lime-400 ≈ #A3E635, lime-600 ≈ #65A30D); we just add DEFAULT + tint.
        lime: {
          DEFAULT: '#A3E635',
          deep: '#65A30D',
          tint: '#F3FBE3'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
