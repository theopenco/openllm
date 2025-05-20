import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	output: "export",
	distDir: "out",
	images: {
		unoptimized: true,
	},
};

export default withMDX(config);
