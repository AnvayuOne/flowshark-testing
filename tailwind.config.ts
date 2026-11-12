import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef4ff', 100: '#dbe6ff', 500: '#3b6cf6', 600: '#2a55db', 700: '#2244b0' },
      },
    },
  },
  plugins: [],
};

export default config;
