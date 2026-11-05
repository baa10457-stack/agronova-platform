import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './i18n/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          forest: {
            50: '#EEF5F1',
            100: '#D6E8DE',
            200: '#AED0BD',
            300: '#7DB096',
            400: '#4D8C70',
            500: '#2A6E52',
            600: '#1D6345',
            700: '#184F38',
            800: '#134030',
            900: '#103D2B',
            950: '#0A2A1D',
          },
          gold: {
            50: '#FBF7E6',
            100: '#F6EDC4',
            200: '#EEDD93',
            300: '#E4CB5E',
            400: '#DDBC45',
            500: '#D4AF37',
            600: '#B8912A',
            700: '#937020',
            800: '#745A1C',
            900: '#5C4818',
          },
          green: {
            50: '#EEF7F2',
            100: '#D3EBDD',
            200: '#A8D7BD',
            300: '#72BB96',
            400: '#43997A',
            500: '#2A7D5E',
            600: '#1D6345',
            700: '#184F38',
            800: '#134030',
            900: '#0E3024',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
