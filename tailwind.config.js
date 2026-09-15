/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/frontend/**/*.{html,ts,tsx}"],
  safelist: [
    { pattern: /bg-(rose|amber|red|emerald|sky|violet)-(100|200|400|500|600|700)/ },
    { pattern: /text-(rose|amber|red|emerald|sky|violet)-(600|700|800)/ },
    { pattern: /border-(rose|amber|red|emerald|sky|violet)-(200|300)/ },
    { pattern: /ring-(rose|amber|red|emerald|sky|violet)-(300|400)/ },
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F2",
        ink: "#2B2B33",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
