import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: { 50: '#EEF5F3', 100: '#D6E7E2', 600: '#2B6B5E', 700: '#1F4D45', 900: '#12302B' },
        amber: { 600: '#B8700A' },
        brick: { 600: '#B3362F' }
      },
      fontFamily: { sans: ['ui-rounded', 'system-ui', 'Segoe UI', 'sans-serif'] }
    }
  },
  plugins: []
}
export default config
