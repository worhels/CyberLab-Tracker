export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#071018',
          panel: '#0d1824',
          line: '#1e3a4c',
          blue: '#38bdf8',
          green: '#22c55e',
          text: '#d7e5f0',
          muted: '#86a3b8',
        },
      },
      boxShadow: {
        glow: '0 0 28px rgba(56, 189, 248, 0.12)',
      },
    },
  },
  plugins: [],
}
