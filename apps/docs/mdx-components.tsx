import { APIPage } from "fumadocs-openapi/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";

import { openapi } from "@/lib/source";

import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		APIPage: (props) => <APIPage {...openapi.getAPIPageProps(props)} />,
		...components,
	};
}
