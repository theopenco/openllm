import { useState } from "react";

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

import type React from "react";

export function AddProviderDialog({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("");
	const [baseUrl, setBaseUrl] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [priority, setPriority] = useState("medium");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Here you would typically send this data to your backend
		toast({
			title: "Provider Added",
			description: `${name} has been added as a provider.`,
		});

		setOpen(false);

		// Reset form
		setName("");
		setProvider("");
		setBaseUrl("");
		setApiKey("");
		setPriority("medium");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add Provider</DialogTitle>
					<DialogDescription>
						Add a new LLM provider to your gateway.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="provider-type">Provider Type</Label>
						<Select value={provider} onValueChange={setProvider} required>
							<SelectTrigger id="provider-type">
								<SelectValue placeholder="Select provider" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="openai">OpenAI</SelectItem>
								<SelectItem value="anthropic">Anthropic</SelectItem>
								<SelectItem value="mistral">Mistral AI</SelectItem>
								<SelectItem value="meta">Meta</SelectItem>
								<SelectItem value="custom">Custom</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="name">Provider Name</Label>
						<Input
							id="name"
							placeholder="e.g. OpenAI Production"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="base-url">Base URL</Label>
						<Input
							id="base-url"
							placeholder="e.g. https://api.openai.com/v1"
							value={baseUrl}
							onChange={(e) => setBaseUrl(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="api-key">API Key</Label>
						<Input
							id="api-key"
							type="password"
							placeholder="Enter your API key"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="priority">Priority</Label>
						<Select value={priority} onValueChange={setPriority}>
							<SelectTrigger id="priority">
								<SelectValue placeholder="Select priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Add Provider</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
