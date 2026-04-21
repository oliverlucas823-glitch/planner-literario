import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        beige: '#E8DDD0',
        'beige-dark': '#C9B99A',
        wine: '#8B3A52',
        'wine-light': '#B05070',
        'wine-muted': '#F5ECF0',
        'text-primary': '#2C1810',
        'text-muted': '#7A6358',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Lato', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
