/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'flex-black': '#111111',
        'flex-white': '#FEFEFE',
        'flex-bg': '#F3F3F0',
        'flex-card': '#FFFFFF',
        'flex-border': '#DDDDD8',
        'flex-muted': '#888888',
        'flex-text': '#555555',
        // Legacy aliases for portal/ops (keep working)
        'flex-navy': '#111111',
        'flex-blue': '#111111',
        'flex-light': '#F3F3F0',
        'flex-accent': '#111111',
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'card-lg': '28px',
        'pill': '100px',
      },
    },
  },
  plugins: [],
};
