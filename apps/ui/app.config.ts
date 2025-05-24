import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		devProxy: {
			"/api": {
				target: "http://localhost:4002",
			},
		},
		prerender: {
			routes: ["/"],
			crawlLinks: true,
		},
		preset: process.env.SERVER_PRESET || "static",
	},
	tsr: {
		appDirectory: "./src",
	},
	vite: {
		server: {
			allowedHosts: ["dev.llmgateway.io"],
		},
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			svgr(),
		],
	},
});
