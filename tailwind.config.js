/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#f8fafc',
            tertiary: '#f1f5f9',
            elevated: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#475569',
            tertiary: '#64748b',
            inverse: '#ffffff',
          },
          border: {
            primary: '#e2e8f0',
            secondary: '#cbd5e1',
          },
          accent: {
            primary: '#06b6d4',
            secondary: '#4f46e5',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
          },
        },
        // Dark mode colors
        dark: {
          bg: {
            primary: '#0f172a',
            secondary: '#1e293b',
            tertiary: '#334155',
            elevated: '#1e293b',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            tertiary: '#94a3b8',
            inverse: '#0f172a',
          },
          border: {
            primary: '#334155',
            secondary: '#475569',
          },
          accent: {
            primary: '#06b6d4',
            secondary: '#4f46e5',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
          },
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-indigo': '0 0 20px rgba(79, 70, 229, 0.3)',
      },
    },
  },
  plugins: [],
}