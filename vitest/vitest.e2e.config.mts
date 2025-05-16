import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["**/*.e2e.ts"],
		exclude: ["**/node_modules/**", "**/dist/**"],
		environment: "node",
		testTimeout: 30000, // Longer timeout for e2e tests
		setupFiles: [],
		reporters: ["default"],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: ["**/node_modules/**", "**/dist/**"],
		},
	},
});
