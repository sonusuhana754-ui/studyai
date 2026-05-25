/** @type {import('tailwindcss').Config} */

// 🎨 BRAND: Change 'accent' to your brand color.
// All NativeWind classes using bg-accent, text-accent, border-accent update automatically.
// Also update Theme.accent in lib/theme.ts to match.

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#050810',
        accent: '#22d3ee',
        surface: 'rgba(14,22,42,0.92)',
        surface2: 'rgba(20,30,55,0.95)',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
}
