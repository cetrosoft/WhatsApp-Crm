export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        sans: ["Cairo", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
