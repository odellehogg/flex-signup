/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FLEX brand colors (original)
        'flex-navy': '#1a1a1a',
        'flex-blue': '#1a1a1a',
        'flex-light': '#f0efe9',
        'flex-accent': '#10b981',
        'flex-bg': '#fafaf8',
        'flex-border': '#e5e4df',
        'flex-muted': '#6b6b6b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
