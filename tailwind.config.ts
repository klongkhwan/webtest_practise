import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EAEBED',
          50: '#FAFAFA',
          100: '#EAEBED',
          200: '#E0E1E3',
          300: '#D1D3D5',
          400: '#C2C4C6',
          500: '#B3B5B7',
          600: '#A4A6A8',
          700: '#959799',
          800: '#86888A',
          900: '#77797B',
        },
        secondary: {
          DEFAULT: '#006989',
          50: '#E6F4F7',
          100: '#CCE9F0',
          200: '#99D3E1',
          300: '#66BDD2',
          400: '#33A7C3',
          500: '#0091B4',
          600: '#007B9A',
          700: '#006989',
          800: '#005770',
          900: '#004557',
        },
      },
    },
  },
  plugins: [],
};

export default config;
