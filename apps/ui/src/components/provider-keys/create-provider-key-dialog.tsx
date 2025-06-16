import { providers } from "@llmgateway/models";
import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import React, { useState } from "react";

import { ProviderSelect } from "./provider-select";
import { useDefaultOrganization } from "@/hooks/useOrganization";
import { Alert, AlertDescription } from "@/lib/components/alert";
import { Badge } from "@/lib/components/badge";
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
import { toast } from "@/lib/components/use-toast";
import { $api } from "@/lib/fetch-client";

export function CreateProviderKeyDialog({
	children,
}: {
	children: React.ReactNode;
}) {
	const posthog = usePostHog();
	const [open, setOpen] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [baseUrl, setBaseUrl] = useState("");
	const [token, setToken] = useState("");
	const [isValidating, setIsValidating] = useState(false);

	const queryKey = $api.queryOptions("get", "/keys/provider").queryKey;
	const queryClient = useQueryClient();

	const { data: organization } = useDefaultOrganization();

	const { data: providerKeysData, isPending: isLoading } =
		$api.useSuspenseQuery("get", "/keys/provider");

	const isProPlan = organization?.plan === "pro";

	const createMutation = $api.useMutation("post", "/keys/provider");

	const availableProviders = providers.filter((provider) => {
		if (provider.id === "llmgateway") {
			return false;
		}

		if (isLoading || !providerKeysData?.providerKeys) {
			return true;
		}

		const existingKey = providerKeysData.providerKeys.find(
			(key: any) => key.provider === provider.id && key.status !== "deleted",
		);
		return !existingKey;
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!isProPlan) {
			toast({
				title: "Upgrade Required",
				description:
					"Provider keys are only available on the Pro plan. Please upgrade to use your own API keys.",
				variant: "destructive",
			});
			return;
		}

		if (!selectedProvider || !token) {
			toast({
				title: "Error",
				description: !selectedProvider
					? "Please select a provider"
					: "Please enter the provider API key",
				variant: "destructive",
			});
			return;
		}

		if (selectedProvider === "llmgateway" && !baseUrl) {
			toast({
				title: "Error",
				description: "Base URL is required for LLM Gateway provider",
				variant: "destructive",
			});
			return;
		}

		const payload: {
			provider: string;
			token: string;
			baseUrl?: string;
			organizationId: string;
		} = {
			provider: selectedProvider,
			token,
			organizationId: organization?.id || "",
		};
		if (baseUrl) {
			payload.baseUrl = baseUrl;
		}

		if (!payload.organizationId) {
			toast({
				title: "Error",
				description: "No organization found. Please try refreshing the page.",
				variant: "destructive",
			});
			return;
		}

		setIsValidating(true);
		toast({ title: "Validating API Key", description: "Please wait..." });

		createMutation.mutate(
			{ body: payload },
			{
				onSuccess: (newKey) => {
					setIsValidating(false);
					posthog.capture("provider_key_added", {
						provider: selectedProvider,
						hasBaseUrl: !!baseUrl,
					});
					toast({
						title: "Provider Key Created",
						description: "The provider key has been validated and saved.",
					});
					queryClient.invalidateQueries({ queryKey });
					setOpen(false);
				},
				onError: (error: any) => {
					setIsValidating(false);
					toast({
						title: "Error",
						description: error?.message ?? "Failed to create key",
						variant: "destructive",
					});
				},
			},
		);
	};

	const handleClose = () => {
		setOpen(false);
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
				{!isProPlan && (
					<Alert>
						<AlertDescription className="flex items-center justify-between">
							<span>Provider keys are only available on the Pro plan.</span>
							<Badge variant="outline">Pro Only</Badge>
						</AlertDescription>
					</Alert>
				)}
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="provider">Provider</Label>
						<ProviderSelect
							onValueChange={setSelectedProvider}
							value={selectedProvider}
							providers={availableProviders}
							loading={isLoading}
						/>
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
							disabled={
								!isProPlan ||
								availableProviders.length === 0 ||
								isLoading ||
								isValidating
							}
						>
							{isValidating ? "Validating..." : "Add Provider Key"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
