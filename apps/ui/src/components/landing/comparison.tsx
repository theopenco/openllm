import { Check, X, Star } from "lucide-react";

import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";

const features = [
	{
		category: "Core Features",
		items: [
			{
				feature: "Unified API Interface",
				llmgateway: true,
				openrouter: true,
				description: "Single API to access multiple LLM providers",
			},
			{
				feature: "Real‑time Analytics Dashboard",
				llmgateway: true,
				openrouter: false,
				description: "Comprehensive usage metrics and cost tracking",
			},
			{
				feature: "Provider Management",
				llmgateway: true,
				openrouter: true,
				description: "Manage multiple LLM provider credentials",
			},
			{
				feature: "Request Routing",
				llmgateway: true,
				openrouter: true,
				description: "Intelligent routing across providers",
			},
		],
	},
	{
		category: "Pricing & Billing",
		items: [
			{
				feature: "Free Plan (credits, 5 % fee)",
				llmgateway: true,
				openrouter: true,
				description:
					"Use credits to access any model — 5 % platform fee on LLM Gateway, no gateway fee on OpenRouter credits",
			},
			{
				feature: "Pro Plan $50/mo (BYOK + credits)",
				llmgateway: true,
				openrouter: false,
				description:
					"Unlimited usage with your own API keys or credits — zero additional fees",
			},
			{
				feature: "No BYOK Gateway Fee (Pro)",
				llmgateway: true,
				openrouter: false,
				description:
					"LLM Gateway Pro processes BYOK traffic at raw provider cost; OpenRouter adds 5 % surcharge",
			},
			{
				feature: "Self‑host Option (MIT, free)",
				llmgateway: true,
				openrouter: false,
				description: "Deploy the gateway in your own VPC at zero cost",
			},
			{
				feature: "Credit‑based System",
				llmgateway: true,
				openrouter: true,
				description: "Pre‑purchase credits for API usage when preferred",
			},
		],
	},
	{
		category: "Developer Experience",
		items: [
			{
				feature: "API Key Management",
				llmgateway: true,
				openrouter: true,
				description: "Secure API key generation and management",
			},
			{
				feature: "Usage Analytics",
				llmgateway: true,
				openrouter: true,
				description: "Track API usage and performance metrics",
			},
			{
				feature: "Model Performance Insights",
				llmgateway: true,
				openrouter: true,
				description: "Compare model performance and costs",
			},
			{
				feature: "Custom Provider Integration",
				llmgateway: true,
				openrouter: false,
				description: "Add your own LLM providers",
			},
		],
	},
	{
		category: "Scale & Reliability",
		items: [
			{
				feature: "High Availability (99.9 % SLA)",
				llmgateway: true,
				openrouter: true,
				description: "Service‑level uptime commitment",
			},
			{
				feature: "Load Balancing",
				llmgateway: true,
				openrouter: true,
				description: "Distribute requests across providers",
			},
			{
				feature: "Failover Support",
				llmgateway: true,
				openrouter: true,
				description: "Automatic failover to backup providers",
			},
			{
				feature: "Rate Limiting",
				llmgateway: true,
				openrouter: true,
				description: "Control API usage and costs",
			},
		],
	},
];

export function Comparison() {
	return (
		<section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
			<div className="container mx-auto px-4 md:px-6">
				<div className="text-center mb-12">
					<Badge variant="outline" className="mb-4">
						Feature Comparison
					</Badge>
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
						LLM Gateway vs OpenRouter
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Compare the features and capabilities of both platforms to make the
						right choice for your LLM needs
					</p>
				</div>

				{/* Feature Comparison Table */}
				<div className="overflow-x-auto">
					<div className="min-w-full">
						{features.map((category, categoryIndex) => (
							<div key={categoryIndex} className="mb-8">
								<h3 className="text-xl font-semibold mb-4 text-center">
									{category.category}
								</h3>
								<div className="bg-card rounded-lg border overflow-hidden">
									<div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 font-medium">
										<div>Feature</div>
										<div className="text-center">LLM Gateway</div>
										<div className="text-center">OpenRouter</div>
										<div>Description</div>
									</div>
									{category.items.map((item, itemIndex) => (
										<div
											key={itemIndex}
											className="grid grid-cols-4 gap-4 p-4 border-t items-center"
										>
											<div className="font-medium">{item.feature}</div>
											<div className="text-center">
												{item.llmgateway ? (
													<Check className="h-5 w-5 text-green-500 mx-auto" />
												) : (
													<X className="h-5 w-5 text-red-500 mx-auto" />
												)}
											</div>
											<div className="text-center">
												{item.openrouter ? (
													<Check className="h-5 w-5 text-green-500 mx-auto" />
												) : (
													<X className="h-5 w-5 text-red-500 mx-auto" />
												)}
											</div>
											<div className="text-sm text-muted-foreground">
												{item.description}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Call to Action */}
				<div className="text-center mt-12">
					<div className="bg-card rounded-lg border p-8 max-w-2xl mx-auto">
						<Star className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
						<h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
						<p className="text-muted-foreground mb-6">
							Upgrade to <strong>Pro</strong> for $50/month and pay{" "}
							<em>zero</em> gateway fees, or self‑host for free forever.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								size="lg"
								className="bg-primary hover:bg-primary/90"
								asChild
							>
								<a href="/#pricing">Go Pro – $50/mo</a>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<a href="/#pricing">See All Plans</a>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
