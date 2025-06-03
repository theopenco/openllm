import { models as modelDefinitions } from "@openllm/models";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Zap, Brain, Mic, ImageIcon, Code } from "lucide-react";

import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

interface ProviderModel {
	model: string;
	providerId: string;
	inputPrice?: number;
	outputPrice?: number;
}

const normaliseProviderName = (raw: string): string => {
	const lower = raw.toLowerCase();
	if (lower.includes("openai") || lower.includes("gpt")) {
		return "OpenAI";
	}
	if (lower.includes("anthropic") || lower.includes("claude")) {
		return "Anthropic";
	}
	if (
		lower.includes("google") ||
		lower.includes("gemini") ||
		lower.includes("vertex")
	) {
		return "Google";
	}
	if (lower.includes("mistral")) {
		return "Mistral";
	}
	if (lower.includes("cohere")) {
		return "Cohere";
	}
	if (lower.includes("meta")) {
		return "Meta";
	}
	return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const getProviderIcon = (provider: string) => {
	const lower = provider.toLowerCase();
	if (lower.includes("openai") || lower.includes("gpt")) {
		return <Brain className="h-5 w-5" />;
	}
	if (lower.includes("anthropic") || lower.includes("claude")) {
		return <Zap className="h-5 w-5" />;
	}
	if (lower.includes("google") || lower.includes("gemini")) {
		return <ImageIcon className="h-5 w-5" />;
	}
	if (lower.includes("audio") || lower.includes("speech")) {
		return <Mic className="h-5 w-5" />;
	}
	return <Code className="h-5 w-5" />;
};

const groupedProviders = modelDefinitions.reduce<
	Record<string, ProviderModel[]>
>((acc, def) => {
	def.providers.forEach((map) => {
		const provider = normaliseProviderName(map.providerId);
		if (!acc[provider]) {
			acc[provider] = [];
		}
		acc[provider].push({
			model: def.model,
			providerId: map.providerId,
			inputPrice: map.inputPrice,
			outputPrice: map.outputPrice,
		});
	});
	return acc;
}, {});

const sortedProviderEntries = Object.entries(groupedProviders)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([providerName, models]) => [
		providerName,
		[...models].sort((a, b) => a.model.localeCompare(b.model)),
	]) as [string, ProviderModel[]][];

const totalModels = modelDefinitions.length;
const totalProviders = sortedProviderEntries.length;

function ProvidersPage() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<Hero navbarOnly />
				<div className="container mx-auto px-4 pt-60 pb-8">
					<header className="text-center mb-12">
						<h1 className="text-4xl font-bold tracking-tight mb-4">
							Supported AI Providers & Models
						</h1>
						<p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
							Access {totalModels} models from {totalProviders} leading AI
							providers through our unified API
						</p>
						<div className="flex justify-center gap-8 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-500 rounded-full" />
								<span>{totalProviders} Providers</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-blue-500 rounded-full" />
								<span>{totalModels} Models</span>
							</div>
						</div>
					</header>

					<section className="space-y-12">
						{sortedProviderEntries.map(([providerName, models]) => (
							<div key={providerName} className="space-y-6">
								<div className="flex items-center gap-3">
									{getProviderIcon(providerName)}
									<h2 className="text-2xl font-semibold capitalize">
										{providerName}
									</h2>
									<span className="text-sm text-muted-foreground">
										{models.length} model{models.length !== 1 && "s"}
									</span>
								</div>
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
									{models.map((model) => (
										<Card
											key={`${model.providerId}-${model.model}`}
											className="flex flex-col h-full hover:shadow-md transition-shadow"
										>
											<CardHeader className="pb-2">
												<CardTitle className="text-base leading-tight line-clamp-1">
													{model.model}
												</CardTitle>
												<CardDescription className="text-xs">
													{model.providerId}
												</CardDescription>
											</CardHeader>
											<CardContent className="mt-auto space-y-2">
												{(model.inputPrice !== undefined ||
													model.outputPrice !== undefined) && (
													<p className="text-xs text-muted-foreground">
														{model.inputPrice !== undefined &&
															`${(model.inputPrice * 1e6).toFixed(2)}¢ in`}
														{model.outputPrice !== undefined &&
															` / ${(model.outputPrice * 1e6).toFixed(2)}¢ out`}
													</p>
												)}
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						))}
					</section>

					<footer className="mt-16 text-center">
						<div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
							<span>Data sourced from @openllm/models</span>
							<ExternalLink className="h-4 w-4" />
						</div>
					</footer>
				</div>
			</main>
			<Footer />
		</div>
	);
}

export const Route = createFileRoute("/models")({
	component: ProvidersPage,
});
