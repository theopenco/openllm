import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import copy from "rollup-plugin-copy";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

// noinspection JSUnusedGlobalSymbols
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
		optimizeDeps: {
			exclude: [
				"cloudflare:sockets",
				"node:net",
				"node:tls",
				"node:fs",
				"node:path",
				"node:crypto",
				"node:stream",
				"node:util",
				"node:dns",
			],
		},
		build: {
			rollupOptions: {
				external: [
					"cloudflare:sockets",
					"node:net",
					"node:tls",
					"node:fs",
					"node:path",
					"node:crypto",
					"node:stream",
					"node:util",
					"node:dns",
				],
			},
		},
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			svgr(),
			copy({
				targets: [{ src: "static/*", dest: ".output/static" }],
				hook: "writeBundle",
			}),
		],
	},
});
