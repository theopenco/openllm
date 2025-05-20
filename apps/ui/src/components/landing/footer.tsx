import { GITHUB_URL } from "@/lib/env";
import Logo from "@/lib/icons/Logo";

export default function Footer() {
	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 bg-white dark:bg-black">
			<div className="container mx-auto px-4">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="mb-6 md:mb-0">
						<div className="flex items-center space-x-2">
							<Logo className="h-8 w-8 rounded-full text-black dark:text-white" />
							<span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
								LLM Gateway
							</span>
						</div>
						<p className="text-zinc-600 dark:text-zinc-500 text-sm mt-2">
							© {new Date().getFullYear()} LLM Gateway. All rights reserved.
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-zinc-700 dark:text-zinc-400">
						<div>
							<h3 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white">
								Product
							</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#features"
										className="text-sm hover:text-black dark:hover:text-white"
									>
										Features
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white">
								Resources
							</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="https://llmgateway.io/docs"
										target="_blank"
										className="text-sm hover:text-black dark:hover:text-white"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href={GITHUB_URL}
										target="_blank"
										className="text-sm hover:text-black dark:hover:text-white"
									>
										GitHub
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
