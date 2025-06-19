import { createFileRoute } from "@tanstack/react-router";

import { ChangelogComponent } from "@/components/changelog";
import { getChangelogList } from "@/lib/data/changelog-loader";

export const Route = createFileRoute("/changelog/")({
	loader: async () => {
		const entries = await getChangelogList();
		return { entries };
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
