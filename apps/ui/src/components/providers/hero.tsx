import {
	providers as providerDefinitions,
	type ProviderId,
} from "@llmgateway/models";
import { Link } from "@tanstack/react-router";
import { Mic } from "lucide-react";

import anthropicLogo from "@/assets/models/anthropic.svg?react";
import CloudRiftLogo from "@/assets/models/cloudrift.svg?react";
import GoogleStudioAiLogo from "@/assets/models/google-studio-ai.svg?react";
import GoogleVertexLogo from "@/assets/models/google-vertex-ai.svg?react";
import InferenceLogo from "@/assets/models/inference-net.svg?react";
import KlusterLogo from "@/assets/models/kluster-ai.svg?react";
import MistralLogo from "@/assets/models/mistral.svg?react";
import OpenAiLogo from "@/assets/models/openai.svg?react";
import TogetherAiLogo from "@/assets/models/together-ai.svg?react";
import { Button } from "@/lib/components/button";
import Logo from "@/lib/icons/Logo";

const providerLogoComponents: Partial<
	Record<ProviderId, React.FC<React.SVGProps<SVGSVGElement>> | null>
> = {
	openai: OpenAiLogo,
	anthropic: anthropicLogo,
	"google-vertex": GoogleVertexLogo,
	"inference.net": InferenceLogo,
	"kluster.ai": KlusterLogo,
	"together.ai": TogetherAiLogo,
	"google-ai-studio": GoogleStudioAiLogo,
	cloudrift: CloudRiftLogo,
};

interface HeroProps {
	providerId: ProviderId;
}

export function Hero({ providerId }: HeroProps) {
	const provider = providerDefinitions.find((p) => p.id === providerId)!;

	const getProviderIcon = (providerId: ProviderId) => {
		const ProviderLogo = providerLogoComponents[providerId];
		if (ProviderLogo) {
			return <ProviderLogo className="h-24 w-24" />;
		}

		if (
			providerId.toLowerCase().includes("vertex") ||
			providerId.toLowerCase().includes("google-vertex")
		) {
			return <GoogleVertexLogo className="h-24 w-24" />;
		}

		if (
			providerId.toLowerCase().includes("google") &&
			(providerId.toLowerCase().includes("studio") ||
				providerId.toLowerCase().includes("ai-studio"))
		) {
			return <GoogleStudioAiLogo className="h-24 w-24" />;
		}

		if (providerId.toLowerCase().includes("mistral")) {
			return <MistralLogo className="h-24 w-24" />;
		}

		if (providerId.includes("audio") || providerId.includes("speech")) {
			return <Mic className="h-24 w-24" />;
		}

		return <Logo className="h-24 w-24" />;
	};

	return (
		<div className="relative isolate overflow-hidden bg-background">
			<div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
				<div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
					{provider.announcement !== null && (
						<div className="mt-24 sm:mt-32 lg:mt-16">
							<div className="inline-flex space-x-6">
								<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/10">
									{provider.announcement}
								</span>
							</div>
						</div>
					)}
					<h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-6xl">
						{provider.name} Provider
					</h1>
					<p className="mt-6 text-lg leading-8 text-muted-foreground">
						{provider.description}
					</p>
					<div className="mt-10 flex items-center gap-x-6">
						<Button asChild>
							<Link to="/signup">Get started</Link>
						</Button>
						<Button variant="outline" asChild>
							<a
								href={`${provider.website}?utm_source=llmgateway-models`}
								target="_blank"
							>
								Visit company
							</a>
						</Button>
					</div>
				</div>
				<div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
					<div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
						<div className="flex items-center justify-center gap-8 relative">
							<div className="h-24 w-24 relative -top-12">
								<Logo className="h-full w-full" />
							</div>
							<div className="flex items-center h-32">
								<div className="w-0.5 h-52 bg-muted-foreground opacity-50 rounded rotate-[30deg]" />
							</div>
							<div className="h-24 w-24 relative top-10">
								{getProviderIcon(providerId)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
