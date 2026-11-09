/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind v4 usa configuración CSS-first en index.css
  // Este archivo se mantiene por compatibilidad con plugins que lo esperen
}