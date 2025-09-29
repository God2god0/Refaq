/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        're-dark': '#0a0a0a',
        're-gray': '#1a1a1a',
        're-card': '#1e1e1e',
        're-input': '#2a2a2a',
        're-text': '#ffffff',
        're-text-secondary': '#a1a1aa',
        're-accent': '#3b82f6',
        're-accent-hover': '#2563eb',
        're-border': '#374151',
        're-success': '#10b981',
        're-warning': '#f59e0b',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
