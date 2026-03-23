import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        p: "#F6F2EA",
        card: "#FAF7F0",
        border: "#D8D2C2",
        bf: "#E8E2D4",
        ink: "#2A2018",
        inkm: "#6B6050",
        inkl: "#A89880",
        acc: "#3B6D11",
        accl: "#EAF3DE",
        acct: "#27500A",
        accb: "#C0DD97",
      },
      fontFamily: {
        display: ["Caveat", "cursive"],
        accent: ["Crimson Pro", "serif"],
        sans: ["system-ui", "sans-serif"],
      },
      borderWidth: {
        thin: "0.5px",
      },
      maxWidth: {
        app: "420px",
      },
    },
  },
  plugins: [],
};

export default config;
