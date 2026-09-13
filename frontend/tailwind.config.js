/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        'surface-muted': '#F0F2F5',
        ink: '#111827',
        'ink-muted': '#667085',
        line: '#E4E7EC',
        primary: '#2457D6',
        'primary-soft': '#EAF0FF',
        success: '#168A5B',
        'success-soft': '#E7F6EF',
        warning: '#B7791F',
        'warning-soft': '#FFF6DE',
        danger: '#C2414B',
        'danger-soft': '#FDECEC',
        superseded: '#7A5AA6',
        'superseded-soft': '#F3EDF9'
      }
    },
  },
  plugins: [],
}
