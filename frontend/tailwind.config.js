/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palet biru gelap (slate/navy) khas dashboard finansial -- tenang, profesional,
        // kontras cukup untuk data-heavy table & angka gaji.
        navy: {
          950: '#0B1220',
          900: '#101827',
          800: '#1B2536',
          700: '#293449',
        },
        accent: {
          DEFAULT: '#3B82F6', // biru aksi utama
          soft: '#93C5FD',
        },
        success: '#16A34A',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
