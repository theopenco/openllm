import { writeFileSync } from "fs";
import { remarkInclude } from "fumadocs-mdx/config";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

import { source } from "@/lib/source";

import type { InferPageType } from "fumadocs-core/source";

const processor = remark().use(remarkMdx).use(remarkInclude).use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof source>) {
	const processed = await processor.process({
		path: page.data._file.absolutePath,
		value: page.data.content,
	});

	return `# ${page.data.title}
URL: ${page.url}

${page.data.description}

${processed.value}`;
}

export async function writeLLMText() {
	const llms = source.generateParams().map((page) => getLLMText(page));
	const text = await Promise.all(llms);
	writeFileSync("public/llms.txt", text.join("\n\n"));
	console.log("✅ llms.txt has been generated");
	process.exit(0);
}

void writeLLMText().catch((err) => {
	console.error(err);
	process.exit(1);
});
