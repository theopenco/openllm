import { models, providers, type ModelDefinition } from "@llmgateway/models";
import { Check, ChevronDown } from "lucide-react";

import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/lib/components/dropdown-menu";

interface ModelSelectorProps {
	selectedModel: string;
	onModelSelect: (model: string) => void;
}

interface LocalModel {
	model: string;
	jsonOutput: boolean;
	providers: Array<{
		providerId: string;
		modelName: string;
		inputPrice?: number;
		outputPrice?: number;
		imageInputPrice?: number;
		contextSize?: number;
		providerInfo?: {
			id: string;
			name: string;
			description: string;
			streaming?: boolean;
			cancellation?: boolean;
			jsonOutput?: boolean;
			color?: string;
		};
	}>;
}

export function ModelSelector({
	selectedModel,
	onModelSelect,
}: ModelSelectorProps) {
	const getProviderInfo = (providerId: string) => {
		return providers.find((p) => p.id === providerId);
	};

	// Group by model instead of provider to avoid duplicates
	const uniqueModels: LocalModel[] = models.map((model) => {
		const modelProviders = model.providers
			.map((provider) => {
				const providerInfo = getProviderInfo(provider.providerId);
				return {
					...provider,
					providerInfo,
				};
			})
			.filter((p) => p.providerInfo); // Filter out providers that don't exist

		const typedModel = model as ModelDefinition;
		return {
			model: typedModel.model,
			jsonOutput: typedModel.jsonOutput ?? false,
			providers: modelProviders,
		};
	});

	const currentModelInfo = uniqueModels.find((m) => m.model === selectedModel);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="gap-2 min-w-[200px] justify-between"
				>
					<div className="flex items-center gap-2">
						{currentModelInfo?.providers[0]?.providerInfo && (
							<div
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor:
										currentModelInfo.providers[0].providerInfo.color,
								}}
							/>
						)}
						<span className="truncate">
							{currentModelInfo?.model || selectedModel}
						</span>
					</div>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
				{uniqueModels.map((model) => (
					<div key={model.model}>
						<DropdownMenuItem
							onSelect={() => onModelSelect(model.model)}
							className="flex items-center justify-between py-3"
						>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2">
									{model.providers.map((provider, index) => (
										<div
											key={provider.providerId}
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: provider.providerInfo?.color }}
											title={provider.providerInfo?.name}
										/>
									))}
								</div>
								<span className="font-medium">{model.model}</span>
								{model.model === selectedModel && (
									<Check className="h-4 w-4 text-green-600" />
								)}
							</div>

							<div className="flex flex-col items-end text-xs text-muted-foreground">
								{model.providers[0]?.inputPrice !== null &&
									model.providers[0]?.inputPrice !== undefined && (
										<div>
											${(model.providers[0].inputPrice * 1e6).toFixed(2)}/1M
											tokens
										</div>
									)}
								<div className="flex gap-1 mt-1">
									{model.jsonOutput && (
										<Badge variant="secondary" className="text-xs px-1 py-0">
											JSON
										</Badge>
									)}
									{model.providers.some((p) => p.providerInfo?.streaming) && (
										<Badge variant="secondary" className="text-xs px-1 py-0">
											Stream
										</Badge>
									)}
								</div>
							</div>
						</DropdownMenuItem>
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
