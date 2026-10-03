/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F19',
        surface: '#131B2E',
        line: '#1E293B',
        brand: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          active: '#4338CA',
        },
        live: {
          DEFAULT: '#10B981',
          dim: '#064E3B',
        },
        warn: {
          DEFAULT: '#F59E0B',
          dim: '#78350F',
        },
        danger: {
          DEFAULT: '#EF4444',
          dim: '#7F1D1D',
        },
        ink: '#F8FAFC',
        ink2: '#94A3B8',
        mute: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
