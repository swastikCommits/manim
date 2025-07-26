/** @type {import('tailwindcss').Config} */
export default {
    content: [
      // App directories
      "../../apps/web/app/**/*.{js,ts,jsx,tsx}",
      // Include UI package components
      "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  } 