/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/frontend/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lilac: { soft: "#F7F4FE", DEFAULT: "#EDE8FA", deep: "#6F5F9C" },
        mint: { soft: "#E2F9D6", DEFAULT: "#B7EFA2", deep: "#3F8A26" },
        coral: { soft: "#FFE4D8", DEFAULT: "#FF9E7D", deep: "#C4502A" },
        grape: { soft: "#EBDDFF", DEFAULT: "#C9A7FF", deep: "#6B3FBF" },
        bubble: { soft: "#FFDCE7", DEFAULT: "#FFA6C0", deep: "#C43D6B" },
        lemon: { soft: "#FFF4CC", DEFAULT: "#FFE17A", deep: "#A07908" },
        aqua: { soft: "#DDF1FF", DEFAULT: "#9BD7FF", deep: "#1E6FA8" },
        ink: "#14131A",
        cream: "#FBF7F2",
      },
      borderRadius: {
        xl2: "1.5rem",
        blob: "28px",
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
