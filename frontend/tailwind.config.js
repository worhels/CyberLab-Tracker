export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0A07',
          panel: '#151411',
          line: '#454441',
          card: '#252421',
          input: '#302F2D',
          text: '#F2F0EA',
          muted: '#BCB8AE',
          secondary: '#8D8A84',
        },
      },
      boxShadow: {
        glow: '0 28px 82px rgba(0, 0, 0, 0.48)',
      },
    },
  },
  plugins: [],
}
