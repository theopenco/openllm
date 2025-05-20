export default function Footer() {
	return (
		<footer className="border-t border-zinc-800 py-12">
			<div className="container mx-auto px-4">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="mb-6 md:mb-0">
						<div className="flex items-center space-x-2">
							<div className="h-6 w-6 rounded-full bg-white" />
							<span className="text-lg font-bold tracking-tight">OpenLLM</span>
						</div>
						<p className="text-zinc-500 text-sm mt-2">
							© {new Date().getFullYear()} OpenLLM. All rights reserved.
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-8">
						<div>
							<h3 className="text-sm font-semibold mb-3">Product</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#features"
										className="text-sm text-zinc-500 hover:text-white"
									>
										Features
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold mb-3">Resources</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#docs-link"
										target="_blank"
										className="text-sm text-zinc-500 hover:text-white"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="https://github.com/theopenco/openllm"
										target="_blank"
										className="text-sm text-zinc-500 hover:text-white"
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
