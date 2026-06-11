import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/bg3-vis/",
  plugins: [react()],
  server: {
    proxy: {
      "/api/bg3": {
        target: "https://gw2wingman.nevermindcreations.de",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});