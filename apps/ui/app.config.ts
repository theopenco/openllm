import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    devProxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    prerender: {
      routes: ["/"],
      crawlLinks: true,
    },
    preset: "vercel",
  },
  tsr: {
    appDirectory: "./src",
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
  },
});
