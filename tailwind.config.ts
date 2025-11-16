import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f3efe4',
        obsidian: '#0f172a',
        ember: '#f97316',
        verdant: '#16a34a',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        parchment: '0 20px 50px rgba(15, 23, 42, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
