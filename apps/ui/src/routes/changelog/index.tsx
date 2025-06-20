import { createFileRoute } from "@tanstack/react-router";
import { allChangelogs, type Changelog } from "content-collections";

import { ChangelogComponent } from "@/components/changelog";

export const Route = createFileRoute("/changelog/")({
	loader: async () => {
		const sortedEntries = allChangelogs
			.sort(
				(a: Changelog, b: Changelog) =>
					new Date(b.date).getTime() - new Date(a.date).getTime(),
			)
			.map(({ content, ...entry }: Changelog) => entry);
		return { entries: sortedEntries };
	},
	head: () => ({
		meta: [
			{ name: "title", content: "Changelog - LLM Gateway" },
			{ property: "og:title", content: "Changelog - LLM Gateway" },
			{
				name: "description",
				content:
					"Stay up to date with the latest features, improvements, and fixes in LLM Gateway.",
			},
			{
				property: "og:description",
				content:
					"Stay up to date with the latest features, improvements, and fixes in LLM Gateway.",
			},
			{ property: "og:type", content: "website" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "Changelog - LLM Gateway" },
			{
				name: "twitter:description",
				content:
					"Stay up to date with the latest features, improvements, and fixes in LLM Gateway.",
			},
		],
	}),
	component: Changelog,
});

function Changelog() {
	const { entries } = Route.useLoaderData();
	return <ChangelogComponent entries={entries} />;
}
