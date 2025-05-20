import {
	LayoutDashboard,
	Key,
	BarChart3,
	Zap,
	Shield,
	Globe,
} from "lucide-react";

const features = [
	{
		icon: <LayoutDashboard className="h-6 w-6" />,
		title: "Unified API Interface",
		description:
			"Compatible with the OpenAI API format for seamless migration and integration.",
	},
	{
		icon: <Key className="h-6 w-6" />,
		title: "Multi-provider Support",
		description: "Connect to various LLM providers through a single gateway.",
	},
	{
		icon: <BarChart3 className="h-6 w-6" />,
		title: "Usage Analytics",
		description:
			"Track requests, tokens used, response times, and costs across all providers.",
	},
	{
		icon: <Zap className="h-6 w-6" />,
		title: "Performance Monitoring",
		description:
			"Compare different models' performance and cost-effectiveness.",
	},
	{
		icon: <Shield className="h-6 w-6" />,
		title: "Secure Key Management",
		description: "Manage API keys for different providers in one secure place.",
	},
	{
		icon: <Globe className="h-6 w-6" />,
		title: "Self-hosted or Cloud",
		description: "Deploy on your own infrastructure or use our hosted version.",
	},
];

export default function Features() {
	return (
		<section
			id="features"
			className="py-20 border-b border-zinc-200 dark:border-zinc-800"
		>
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold tracking-tight mb-12 text-center text-zinc-900 dark:text-white">
					Features
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div
							key={index}
							className="p-6 border border-zinc-300 dark:border-zinc-800 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors bg-white dark:bg-zinc-900"
						>
							<div className="p-2 bg-zinc-100 dark:bg-zinc-800 inline-block rounded-lg mb-4 text-zinc-800 dark:text-white">
								{feature.icon}
							</div>
							<h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
								{feature.title}
							</h3>
							<p className="text-zinc-600 dark:text-zinc-400">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
