import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/bg3-api": {
        target: "https://gw2wingman.nevermindcreations.de",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/bg3-api/, "/api/bg3"),
      },
    },
  },
});