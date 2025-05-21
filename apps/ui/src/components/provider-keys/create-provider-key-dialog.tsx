import { providers, type ProviderId } from "@openllm/models";
import { useState } from "react";

import { useCreateProviderKey, useProviderKeys } from "./hooks/useProviderKeys";
import anthropicLogo from "@/assets/models/anthropic.svg?react";
import GoogleVertexLogo from "@/assets/models/google-vertex-ai.svg?react";
import InferenceLogo from "@/assets/models/inference-net.svg?react";
import KlusterLogo from "@/assets/models/kluster-ai.svg?react";
import OpenAiLogo from "@/assets/models/openai.svg?react";
import OpenLLMLogo from "@/assets/models/openllm.svg?react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import { toast } from "@/lib/components/use-toast";

const providerLogoComponents: Partial<
	Record<ProviderId, React.FC<React.SVGProps<SVGSVGElement>> | null>
> = {
	llmgateway: OpenLLMLogo,
	openai: OpenAiLogo,
	anthropic: anthropicLogo,
	"google-vertex": GoogleVertexLogo,
	"inference.net": InferenceLogo,
	"kluster.ai": KlusterLogo,
};

export function CreateProviderKeyDialog({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<string>("");
	const [baseUrl, setBaseUrl] = useState("");
	const [token, setToken] = useState("");

	const { data: providerKeysData, isLoading } = useProviderKeys();
	const createMutation = useCreateProviderKey();

	// Filter out providers that already have keys and llmgateway provider
	const availableProviders = providers.filter((provider) => {
		if (provider.id === "llmgateway") {
			return false;
		}

		if (isLoading || !providerKeysData?.providerKeys) {
			return true;
		}

		// Check if this provider already has a key (that's not deleted)
		const existingKey = providerKeysData.providerKeys.find(
			(key) => key.provider === provider.id && key.status !== "deleted",
		);

		return !existingKey;
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedProvider) {
			toast({
				title: "Error",
				description: "Please select a provider",
				variant: "destructive",
				className: "text-white",
			});
			return;
		}

		if (!token) {
			toast({
				title: "Error",
				description: "Please enter the provider API key",
				variant: "destructive",
				className: "text-white",
			});
			return;
		}

		if (selectedProvider === "llmgateway" && !baseUrl) {
			toast({
				title: "Error",
				description: "Base URL is required for LLM Gateway provider",
				variant: "destructive",
				className: "text-white",
			});
			return;
		}

		const payload: { provider: string; token: string; baseUrl?: string } = {
			provider: selectedProvider,
			token: token,
		};

		if (baseUrl) {
			payload.baseUrl = baseUrl;
		}

		createMutation.mutate(payload, {
			onSuccess: () => {
				toast({
					title: "Provider Key Created",
					description: "The provider key has been created successfully.",
				});
				setOpen(false);
			},
			onError: (error) => {
				toast({
					title: "Error",
					description: error.message,
					variant: "destructive",
					className: "text-white",
				});
			},
		});
	};

	const handleClose = () => {
		setOpen(false);
		// Reset form after dialog is closed
		setTimeout(() => {
			setSelectedProvider("");
			setBaseUrl("");
			setToken("");
		}, 300);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add Provider Key</DialogTitle>
					<DialogDescription>
						Create a new provider key to connect to an LLM provider.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="provider">Provider</Label>
						<Select
							onValueChange={setSelectedProvider}
							value={selectedProvider}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select provider..." />
							</SelectTrigger>
							<SelectContent>
								{isLoading ? (
									<SelectItem value="loading" disabled>
										Loading providers...
									</SelectItem>
								) : availableProviders.length > 0 ? (
									<>
										{availableProviders.map((provider) => {
											const Logo = providerLogoComponents[provider.id];
											return (
												<SelectItem key={provider.id} value={provider.id}>
													<div className="flex items-center gap-2">
														{typeof Logo === "function" && (
															<Logo className="h-4 w-4 text-white" />
														)}
														<span>{provider.name}</span>
													</div>
												</SelectItem>
											);
										})}
									</>
								) : (
									<SelectItem value="none" disabled>
										All providers already have keys
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="token">Provider API Key</Label>
						<Input
							id="token"
							placeholder="Enter the provider's API key"
							value={token}
							onChange={(e) => setToken(e.target.value)}
							required
						/>
					</div>
					{selectedProvider === "llmgateway" && (
						<div className="space-y-2">
							<Label htmlFor="baseUrl">Base URL</Label>
							<Input
								id="baseUrl"
								placeholder="e.g. https://api.example.com"
								value={baseUrl}
								onChange={(e) => setBaseUrl(e.target.value)}
								required
							/>
							<p className="text-muted-foreground text-xs">
								Required for LLM Gateway provider
							</p>
						</div>
					)}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={availableProviders.length === 0 || isLoading}
						>
							Add Provider Key
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
