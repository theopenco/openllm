import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	basePath: process.env.NODE_ENV === "production" ? "/docs" : undefined,
};

export default withMDX(config);
