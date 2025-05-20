import { Link } from "@tanstack/react-router";

import { Button } from "@/lib/components/button";

export default function CallToAction() {
	return (
		<section className="py-20">
			<div className="container mx-auto px-4">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-3xl font-bold tracking-tight mb-6">
						Ready to Simplify Your LLM Integration?
					</h2>
					<p className="text-zinc-400 mb-10">
						Start using OpenLLM today and take control of your AI
						infrastructure.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							className="bg-white text-black hover:bg-zinc-200 px-8 py-6 text-base w-full sm:w-auto font-medium"
							asChild
						>
							<Link to="/signup">Create Free Account</Link>
						</Button>
						<Button
							variant="outline"
							className="border-zinc-800 bg-transparent text-white hover:text-white hover:border-zinc-700 px-8 py-6 text-base w-full sm:w-auto"
							asChild
						>
							<a href="https://github.com/theopenco/openllm" target="_blank">
								Self-host OpenLLM
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
