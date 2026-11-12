import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './features/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#f3f5ec',
          100: '#e7eddf',
          200: '#d5e3c5',
          300: '#c4db92',
          400: '#9fc15c',
          500: '#70943e',
          600: '#315b48',
          700: '#254c3e',
          800: '#1c4037',
          900: '#15352e',
        },
        indigo: {
          50: '#eff7f4',
          100: '#d9ebe5',
          200: '#badbd0',
          300: '#93c4b4',
          400: '#66a894',
          500: '#438a78',
          600: '#2f6b5e',
          700: '#28584f',
          800: '#224940',
          900: '#1c3a34',
        },
        purple: {
          50: '#fff3ee',
          100: '#fbe4dc',
          200: '#f5c5b7',
          300: '#eda18c',
          400: '#e37c60',
          500: '#d95f3f',
          600: '#c34f35',
          700: '#a6412d',
          800: '#873626',
          900: '#682b21',
        },
        brand: {
          50: '#f3f5ec',
          100: '#e7eddf',
          200: '#d5e3c5',
          300: '#c4db92',
          400: '#9fc15c',
          500: '#70943e',
          600: '#315b48',
          700: '#254c3e',
          800: '#1c4037',
          900: '#15352e',
        },
      },
      boxShadow: {
        soft: '0 12px 32px rgba(24, 63, 55, 0.1)',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at top, rgba(217, 239, 117, 0.22), transparent 35%)',
      },
    },
  },
  plugins: [],
};

export default config;
