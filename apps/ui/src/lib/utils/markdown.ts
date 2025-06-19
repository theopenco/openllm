export interface ChangelogFrontmatter {
	id: string;
	slug: string;
	date: string;
	title: string;
	summary: string;
	image: {
		src: string;
		alt: string;
		width: number;
		height: number;
	};
}

export interface ChangelogEntry extends ChangelogFrontmatter {
	content: string;
}

// Parse frontmatter from markdown content
export function parseFrontmatter(markdown: string): {
	frontmatter: ChangelogFrontmatter;
	content: string;
} {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = markdown.match(frontmatterRegex);

	if (!match) {
		throw new Error("Invalid markdown format: missing frontmatter");
	}

	const [, frontmatterStr, content] = match;

	// Parse YAML-like frontmatter
	const frontmatter = parseFrontmatterString(frontmatterStr);

	return {
		frontmatter,
		content: content.trim(),
	};
}

function parseFrontmatterString(frontmatterStr: string): ChangelogFrontmatter {
	const lines = frontmatterStr.split("\n");
	const result: any = {};
	let currentObject: any = null;
	let currentKey = "";

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}

		// Calculate indentation
		const indent = line.length - line.trimStart().length;

		if (trimmed.includes(":")) {
			const [key, ...valueParts] = trimmed.split(":");
			const value = valueParts.join(":").trim();
			const cleanKey = key.trim();

			if (indent === 0) {
				// Top-level property
				if (value === "") {
					// Start of nested object
					currentKey = cleanKey;
					currentObject = {};
					result[currentKey] = currentObject;
				} else {
					// Simple top-level value
					result[cleanKey] = parseValue(value);
					currentObject = null;
					currentKey = "";
				}
			} else if (indent > 0 && currentObject) {
				// Nested property
				currentObject[cleanKey] = parseValue(value);
			}
		}
	}

	return result as ChangelogFrontmatter;
}

function parseValue(value: string): any {
	const trimmedValue = value.trim();

	// Handle quoted strings
	if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
		return trimmedValue.slice(1, -1);
	}

	// Handle numbers
	if (!isNaN(Number(trimmedValue)) && trimmedValue !== "") {
		return Number(trimmedValue);
	}

	// Handle booleans
	if (trimmedValue === "true") {
		return true;
	}
	if (trimmedValue === "false") {
		return false;
	}

	// Return as string
	return trimmedValue;
}

// Get markdown component options with custom styling
export function getMarkdownOptions() {
	return {
		overrides: {
			h1: {
				props: {
					className:
						"text-3xl md:text-4xl font-bold tracking-tight text-white mb-6",
				},
			},
			h2: {
				props: {
					className: "text-2xl font-semibold text-white mt-8 mb-4",
				},
			},
			h3: {
				props: {
					className: "text-xl font-medium text-white mt-6 mb-3",
				},
			},
			p: {
				props: {
					className: "text-gray-300 leading-relaxed mb-4",
				},
			},
			ul: {
				props: {
					className: "space-y-2 mb-4",
				},
			},
			li: {
				props: {
					className: "text-gray-300 flex items-start gap-2",
				},
			},
			strong: {
				props: {
					className: "text-white font-semibold",
				},
			},
			code: {
				props: {
					className:
						"bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm font-mono",
				},
			},
			pre: {
				props: {
					className:
						"bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4",
				},
			},
			blockquote: {
				props: {
					className:
						"border-l-4 border-purple-500 pl-4 italic text-gray-400 mb-4",
				},
			},
			a: {
				props: {
					className: "text-purple-400 hover:text-purple-300 underline",
				},
			},
			hr: {
				props: {
					className: "border-gray-700 my-8",
				},
			},
		},
	};
}
