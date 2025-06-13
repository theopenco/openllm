import {
	models as modelDefinitions,
	providers as providerDefinitions,
} from "@llmgateway/models";
import { createFileRoute } from "@tanstack/react-router";

import Footer from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/providers/hero";
import { Badge } from "@/lib/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { formatContextSize } from "@/lib/utils";

export const Route = createFileRoute("/providers/$name")({
	component: ProviderPage,
	loader: ({ params }: { params: { name: string } }) => {
		const provider = providerDefinitions.find((p) => p.name === params.name);
		if (!provider || provider.name === "LLM Gateway") {
			throw new Error("Provider not found");
		}
		return provider;
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return { title: "Provider - LLM Gateway" };
		}
		return {
			title: `${loaderData.name} Provider - LLM Gateway`,
			meta: [
				{ name: "description", content: loaderData.description },
				{
					property: "og:title",
					content: `${loaderData.name} Provider - LLM Gateway`,
				},
				{ property: "og:description", content: loaderData.description },
				{
					property: "og:image",
					content: `/static/providers/${loaderData.id}.png`,
				},
				{ property: "og:type", content: "website" },
				{
					property: "og:url",
					content: `https://llmgateway.io/providers/${loaderData.id}`,
				},
				{ name: "twitter:card", content: "summary_large_image" },
				{
					name: "twitter:title",
					content: `${loaderData.name} Provider - LLM Gateway`,
				},
				{ name: "twitter:description", content: loaderData.description },
				{
					name: "twitter:image",
					content: `/static/providers/${loaderData.id}.png`,
				},
			],
		};
	},
});

function ProviderPage() {
	const provider = Route.useLoaderData();

	const providerModels = modelDefinitions
		.filter((m) => m.providers.some((p) => p.providerId === provider.id))
		.map((m) => {
			const providerModel = m.providers.find(
				(p) => p.providerId === provider.id,
			)!;
			const tags = [];
			if ("jsonOutput" in m && m.jsonOutput) {
				tags.push("JSON Output");
			}
			if (providerModel.streaming) {
				tags.push("Streaming");
			}
			if (providerModel.contextSize) {
				tags.push(`${formatContextSize(providerModel.contextSize)} context`);
			}

			return {
				id: m.model,
				name: m.model,
				description: `${m.model} model from ${provider.name}`,
				tags,
				contextSize: providerModel.contextSize,
				inputPrice: providerModel.inputPrice,
				outputPrice: providerModel.outputPrice,
				status: "active",
			};
		});

	return (
		<>
			<Navbar />
			<Hero providerId={provider.id} />
			<div className="container mx-auto py-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{providerModels.map((model) => (
						<Card
							key={model.id}
							className="flex flex-col h-full hover:shadow-md transition-shadow"
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base leading-tight line-clamp-1">
									{model.name}
								</CardTitle>
								<CardDescription className="text-xs">
									{provider.name}
								</CardDescription>
							</CardHeader>
							<CardContent className="mt-auto space-y-2">
								<div className="flex flex-wrap gap-2">
									{model.tags.map((tag) => (
										<Badge key={tag} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
								{model.contextSize && (
									<p className="text-xs text-muted-foreground">
										Context: {formatContextSize(model.contextSize)}
									</p>
								)}
								{(model.inputPrice !== undefined ||
									model.outputPrice !== undefined) && (
									<p className="text-xs text-muted-foreground">
										{model.inputPrice !== undefined &&
											`$${(model.inputPrice * 1e6).toFixed(2)} in`}
										{model.outputPrice !== undefined &&
											` / $${(model.outputPrice * 1e6).toFixed(2)} out`}
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			</div>
			<Footer />
		</>
	);
}
