/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",                 // Your main app file
    "./app/index.tsx",               // The updated entry point
    "./components/**/*.{js,jsx,ts,tsx}", // Your components directory
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
