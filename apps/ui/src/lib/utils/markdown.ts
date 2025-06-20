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

// Get markdown component options with custom styling
export function getMarkdownOptions() {
	return {
		overrides: {
			h1: {
				props: {
					className:
						"text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6",
				},
			},
			h2: {
				props: {
					className: "text-2xl font-semibold text-foreground mt-8 mb-4",
				},
			},
			h3: {
				props: {
					className: "text-xl font-medium text-foreground mt-6 mb-3",
				},
			},
			p: {
				props: {
					className: "text-muted-foreground leading-relaxed mb-4",
				},
			},
			ul: {
				props: {
					className: "space-y-2 mb-4",
				},
			},
			li: {
				props: {
					className: "text-muted-foreground flex items-start gap-2",
				},
			},
			strong: {
				props: {
					className: "text-foreground font-semibold",
				},
			},
			code: {
				props: {
					className:
						"bg-muted text-muted-foreground px-2 py-1 rounded text-sm font-mono",
				},
			},
			pre: {
				props: {
					className:
						"bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4",
				},
			},
			blockquote: {
				props: {
					className:
						"border-l-4 border-primary pl-4 italic text-muted-foreground mb-4",
				},
			},
			a: {
				props: {
					className: "text-primary hover:text-primary/80 underline",
				},
			},
			hr: {
				props: {
					className: "border-border my-8",
				},
			},
		},
	};
}
