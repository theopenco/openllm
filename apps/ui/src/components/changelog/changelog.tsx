import { Link } from "@tanstack/react-router";
import { use } from "react";

import { AppHeader } from "./app-header";
import Footer from "@/components/landing/footer";
import { getChangelogList } from "@/lib/data/changelog-loader";

import type { ChangelogFrontmatter } from "@/lib/utils/markdown";

interface ChangelogComponentProps {
	entries?: ChangelogFrontmatter[];
}

export function ChangelogComponent({ entries }: ChangelogComponentProps = {}) {
	const changelogEntries = entries || use(getChangelogList());

	return (
		<div className="bg-[#0B0B0B] text-gray-50 min-h-screen font-sans">
			<AppHeader />
			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 md:mb-16">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 md:mb-0">
						Changelog
					</h1>
					{/* <Button
						variant="ghost"
						className="text-gray-300 hover:text-white hover:bg-gray-800"
					>
						<BellIcon className="h-4 w-4 mr-2" />
						Subscribe to updates
					</Button> */}
				</div>

				<div className="space-y-16 max-w-5xl mx-auto">
					{changelogEntries.map((entry: ChangelogFrontmatter) => (
						<article
							key={entry.id}
							className="grid md:grid-cols-[150px_1fr] gap-x-8 gap-y-4"
						>
							<time
								dateTime={entry.date}
								className="text-sm text-gray-400 md:text-right pt-1"
							>
								{new Date(entry.date).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
							<div className="space-y-8">
								<div className="space-y-4">
									<h2 className="text-2xl font-medium text-white hover:text-gray-300 transition-colors">
										<Link to="/changelog/$slug" params={{ slug: entry.slug }}>
											{entry.title}
										</Link>
									</h2>
									<p className="text-gray-300 leading-relaxed">
										{entry.summary}
									</p>
									<Link
										to="/changelog/$slug"
										params={{ slug: entry.slug }}
										className="text-sm text-purple-400 hover:text-purple-300"
									>
										Read more &rarr;
									</Link>
								</div>
								<div className="bg-[#141414] border border-gray-800 rounded-lg overflow-hidden">
									<Link to="/changelog/$slug" params={{ slug: entry.slug }}>
										<img
											src={entry.image.src}
											alt={entry.image.alt}
											width={entry.image.width}
											height={entry.image.height}
											className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
										/>
									</Link>
								</div>
							</div>
						</article>
					))}
				</div>
			</main>
			<Footer />
		</div>
	);
}
