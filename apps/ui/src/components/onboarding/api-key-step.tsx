import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Key } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useDefaultProject } from "../../hooks/useDefaultProject";
import { Button } from "../../lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../lib/components/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../lib/components/form";
import { Input } from "../../lib/components/input";
import { Step } from "../../lib/components/stepper";
import { toast } from "../../lib/components/use-toast";
import { $api } from "../../lib/fetch-client";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function ApiKeyStep() {
	const [isLoading, setIsLoading] = useState(false);
	const [apiKey, setApiKey] = useState<string | null>(null);
	const { data: defaultProject, isError } = useDefaultProject();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "My First API Key",
		},
	});

	const createApiKey = $api.useMutation("post", "/keys/api");

	async function onSubmit(values: FormValues) {
		setIsLoading(true);

		if (!defaultProject?.id) {
			toast({
				title: "Error",
				description: "No project available. Please try again.",
				variant: "destructive",
			});
			setIsLoading(false);
			return;
		}

		try {
			const response = await createApiKey.mutateAsync({
				body: {
					description: values.name,
					projectId: defaultProject.id,
				},
			});
			setApiKey(response.apiKey.token);
			toast({
				title: "API key created",
				description: "Your API key has been created successfully.",
			});
		} catch (_error) {
			toast({
				title: "Error",
				description: "Failed to create API key. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}

	function copyToClipboard() {
		if (apiKey) {
			navigator.clipboard.writeText(apiKey);
			toast({
				title: "Copied to clipboard",
				description: "API key copied to clipboard",
			});
		}
	}

	return (
		<Step>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2 text-center">
					<h1 className="text-2xl font-bold">Create Your API Key</h1>
					<p className="text-muted-foreground">
						You'll need an API key to make requests to the LLM Gateway.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							API Key
						</CardTitle>
						<CardDescription>
							Create an API key to authenticate your requests to the LLM
							Gateway.
							{isError || !defaultProject ? (
								<span className="text-destructive block mt-1">
									Unable to load project. Please try again.
								</span>
							) : (
								<span className="block mt-1">
									Project: {defaultProject.name}
								</span>
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!apiKey ? (
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-4"
								>
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>API Key Name</FormLabel>
												<FormControl>
													<Input placeholder="My API Key" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full"
										disabled={isLoading || isError || !defaultProject}
									>
										{isLoading ? "Creating..." : "Create API Key"}
									</Button>
								</form>
							</Form>
						) : (
							<div className="flex flex-col gap-4">
								<div className="rounded-md bg-muted p-4">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium break-all">{apiKey}</p>
										<Button
											variant="ghost"
											size="sm"
											onClick={copyToClipboard}
											className="h-8 w-8 p-0"
										>
											<Copy className="h-4 w-4" />
											<span className="sr-only">Copy API key</span>
										</Button>
									</div>
								</div>
								<div className="text-muted-foreground rounded-md bg-yellow-100 dark:bg-yellow-950 p-4 text-sm">
									<p className="font-medium text-yellow-800 dark:text-yellow-300">
										Important
									</p>
									<p className="mt-1">
										This API key will only be shown once. Make sure to copy it
										now and store it securely. You can always create new API
										keys later.
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</Step>
	);
}
