import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { allChangelogs, type Changelog } from "content-collections";
import { ArrowLeftIcon } from "lucide-react";
import Markdown from "markdown-to-jsx";

import { AppHeader } from "@/components/changelog/app-header";
import Footer from "@/components/landing/footer";
import { getMarkdownOptions } from "@/lib/utils/markdown";

export const Route = createFileRoute("/changelog/$slug")({
	loader: async ({ params }) => {
		const entry = allChangelogs.find(
			(entry: Changelog) => entry.slug === params.slug,
		);
		if (!entry) {
			throw notFound();
		}
		return { entry };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				name: "title",
				content: `${loaderData?.entry.title} - Changelog - LLM Gateway`,
			},
			{
				property: "og:title",
				content: `${loaderData?.entry.title} - Changelog - LLM Gateway`,
			},
			{
				name: "description",
				content: loaderData?.entry.summary || "LLM Gateway changelog entry",
			},
			{
				property: "og:description",
				content: loaderData?.entry.summary || "LLM Gateway changelog entry",
			},
			{
				property: "og:image",
				content: loaderData?.entry.image.src || "/opengraph.png",
			},
			{
				property: "og:image:width",
				content: loaderData?.entry.image.width?.toString() || "800",
			},
			{
				property: "og:image:height",
				content: loaderData?.entry.image.height?.toString() || "400",
			},
			{
				property: "og:image:alt",
				content:
					loaderData?.entry.image.alt ||
					loaderData?.entry.title ||
					"LLM Gateway changelog entry",
			},
			{ property: "og:type", content: "article" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: `${loaderData?.entry.title} - Changelog - LLM Gateway`,
			},
			{
				name: "twitter:description",
				content: loaderData?.entry.summary || "LLM Gateway changelog entry",
			},
			{
				name: "twitter:image",
				content: loaderData?.entry.image.src || "/opengraph.png",
			},
			{
				name: "twitter:image:alt",
				content:
					loaderData?.entry.image.alt ||
					loaderData?.entry.title ||
					"LLM Gateway changelog entry",
			},
		],
	}),
	component: ChangelogEntryPage,
});

function ChangelogEntryPage() {
	const { entry } = Route.useLoaderData();

	return (
		<div className="bg-background text-foreground min-h-screen font-sans">
			<AppHeader />
			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
				<div className="mb-8">
					<Link
						to="/changelog"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon className="h-4 w-4 mr-2" />
						Back to Changelog
					</Link>
				</div>

				<article className="space-y-8">
					<header className="space-y-2">
						<time
							dateTime={entry.date}
							className="text-sm text-muted-foreground"
						>
							{new Date(entry.date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</time>
						<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
							{entry.title}
						</h1>
					</header>

					<div className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none text-muted-foreground leading-relaxed space-y-6">
						<Markdown options={getMarkdownOptions()}>{entry.content}</Markdown>
					</div>

					<div className="bg-card border border-border rounded-lg overflow-hidden mt-8">
						<img
							src={entry.image.src}
							alt={entry.image.alt}
							width={entry.image.width}
							height={entry.image.height}
							className="w-full h-96 object-cover"
						/>
					</div>
				</article>
			</main>
			<Footer />
		</div>
	);
}
