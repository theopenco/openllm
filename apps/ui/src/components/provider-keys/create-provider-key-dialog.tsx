import { providers } from "@openllm/models";
import { useState } from "react";

import { useCreateProviderKey } from "./hooks/useProviderKeys";
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

export function CreateProviderKeyDialog({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<string>("");
	const [baseUrl, setBaseUrl] = useState("");
	const [token, setToken] = useState("");

	const createMutation = useCreateProviderKey();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedProvider) {
			toast({
				title: "Error",
				description: "Please select a provider",
				variant: "destructive",
			});
			return;
		}

		if (!token) {
			toast({
				title: "Error",
				description: "Please enter the provider API key",
				variant: "destructive",
			});
			return;
		}

		if (selectedProvider === "openllm" && !baseUrl) {
			toast({
				title: "Error",
				description: "Base URL is required for OpenLLM provider",
				variant: "destructive",
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
					<DialogTitle>Create Provider Key</DialogTitle>
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
								{providers.map((provider) => (
									<SelectItem key={provider.id} value={provider.id}>
										{provider.name}
									</SelectItem>
								))}
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
					{selectedProvider === "openllm" && (
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
								Required for OpenLLM provider
							</p>
						</div>
					)}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit">Create Provider Key</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
