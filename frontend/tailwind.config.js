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
        // ---------------------------------------------------------------
        // APP SCALE — used by Login, Dashboard and the Workflow Builder.
        // These are the original values and must stay that way: the landing
        // redesign has its own isolated `lp` scale below, so restyling the
        // marketing page can never shift the authenticated product UI.
        // ---------------------------------------------------------------
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Cinema-dark layered surfaces (avoid pure black)
        dark: {
          950: '#070a10',
          900: '#0b0f17',
          850: '#0d1220',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
        aiv: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 900: '#4c1d95' }, // Gemini / AI
        flow: { 400: '#22d3ee', 500: '#06b6d4' },                                 // data-flow / edges
        run: { 400: '#34d399', 500: '#22c55e', 600: '#16a34a' },                  // execution / "Run"

        // ---------------------------------------------------------------
        // LANDING SCALE — consumed only by src/landing/**. Adding tokens is
        // inert for every other page because nothing outside landing/ emits
        // an `lp-*` class.
        // ---------------------------------------------------------------
        lp: {
          50: '#ecfdf5',
          100: '#d1fae5',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // primary green accent
          600: '#059669',
          700: '#047857',
          800: '#064e3b', // raised panel
          850: '#022c22', // elevated surface
          900: '#060c18', // page ground
          950: '#030712', // deepest negative space
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'blob-a': 'blobA 18s ease-in-out infinite',
        'blob-b': 'blobB 22s ease-in-out infinite',
        'run-dot': 'runDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        blobA: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(40px,-30px) scale(1.08)' },
        },
        blobB: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-36px,28px) scale(1.1)' },
        },
        runDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(0.7)' },
        },
      },
    },
  },
  plugins: [],
};
