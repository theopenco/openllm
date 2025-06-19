import { parseFrontmatter, type ChangelogEntry } from "../utils/markdown";

// Import all markdown files
const markdownFiles = import.meta.glob("/src/content/changelog/*.md", {
	as: "raw",
});

// Cache for loaded entries
let cachedEntries: ChangelogEntry[] | null = null;

export async function loadChangelogEntries(): Promise<ChangelogEntry[]> {
	if (cachedEntries) {
		return cachedEntries;
	}

	const entries: ChangelogEntry[] = [];

	for (const [path, loader] of Object.entries(markdownFiles)) {
		try {
			const markdown = await loader();
			const { frontmatter, content } = parseFrontmatter(markdown);

			entries.push({
				...frontmatter,
				content,
			});
		} catch (error) {
			console.error(`Error loading changelog entry from ${path}:`, error);
		}
	}

	// Sort by date (newest first)
	entries.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	cachedEntries = entries;
	return entries;
}

export async function getChangelogEntry(
	slug: string,
): Promise<ChangelogEntry | null> {
	const entries = await loadChangelogEntries();
	return entries.find((entry) => entry.slug === slug) || null;
}

// Get all changelog entries for the list view
export async function getChangelogList(): Promise<
	Omit<ChangelogEntry, "content">[]
> {
	const entries = await loadChangelogEntries();
	return entries.map(({ content, ...entry }) => entry);
}
