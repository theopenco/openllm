import { Copy } from "lucide-react";
import { useState } from "react";

import { useCreateApiKey } from "./hooks/useApiKeys";
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

import type React from "react";

export function CreateApiKeyDialog({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"form" | "created">("form");
	const [name, setName] = useState("");
	const [apiKey, setApiKey] = useState("");

	const createMutation = useCreateApiKey();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate(name, {
			onSuccess: (data) => {
				setApiKey(data.apiKey.token);
				setStep("created");
			},
		});
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(apiKey);
		toast({
			title: "API Key Copied",
			description: "The API key has been copied to your clipboard.",
		});
	};

	const handleClose = () => {
		setOpen(false);
		setTimeout(() => {
			setStep("form");
			setName("");
			setApiKey("");
		}, 300);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				{step === "form" ? (
					<>
						<DialogHeader>
							<DialogTitle>Create API Key</DialogTitle>
							<DialogDescription>
								Create a new API key to access LLM Gateway.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">API Key Name</Label>
								<Input
									id="name"
									placeholder="e.g. Production API Key"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={handleClose}>
									Cancel
								</Button>
								<Button type="submit">Create API Key</Button>
							</DialogFooter>
						</form>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>API Key Created</DialogTitle>
							<DialogDescription>
								Your API key has been created. Please copy it now as you won't
								be able to see it again.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="api-key">API Key</Label>
								<div className="flex items-center space-x-2">
									<Input
										id="api-key"
										value={apiKey}
										readOnly
										className="font-mono text-xs"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={copyToClipboard}
									>
										<Copy className="h-4 w-4" />
										<span className="sr-only">Copy API key</span>
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									Make sure to store this API key securely. You won't be able to
									see it again.
								</p>
							</div>
							<DialogFooter>
								<Button onClick={handleClose}>Done</Button>
							</DialogFooter>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
