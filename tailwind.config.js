/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm Monochrome Palette
        'flex-navy': '#1a1a1a',      // Soft black (primary)
        'flex-blue': '#1a1a1a',      // Soft black (was accent blue)
        'flex-light': '#f0efe9',     // Warm gray surface
        'flex-accent': '#10b981',    // Keep green for checkmarks/WhatsApp
        'flex-surface': '#f0efe9',   // Warm gray surface
        'flex-bg': '#fafaf8',        // Warm off-white background
        'flex-border': '#e5e4df',    // Warm gray border
        'flex-muted': '#6b6b6b',     // Muted text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundColor: {
        'warm-white': '#fafaf8',
        'warm-gray': '#f0efe9',
      },
    },
  },
  plugins: [],
}
