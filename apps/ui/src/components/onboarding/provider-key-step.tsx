import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../lib/components/select";
import { Step } from "../../lib/components/stepper";
import { toast } from "../../lib/components/use-toast";
import { $api } from "../../lib/fetch-client";
import { useDefaultOrganization } from "@/hooks/useOrganization";

const formSchema = z.object({
	provider: z.string().min(1, "Provider is required"),
	key: z.string().min(1, "API key is required"),
	baseUrl: z.string().optional(),
});

interface Provider {
	id: string;
	name: string;
	supportsBaseUrl?: boolean;
}

type FormValues = z.infer<typeof formSchema>;

export function ProviderKeyStep() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { data: organization } = useDefaultOrganization();

	const { data: _providerKeysData } = $api.useSuspenseQuery(
		"get",
		"/keys/provider",
	);

	const providers = [
		{ id: "openai", name: "OpenAI", supportsBaseUrl: false },
		{ id: "anthropic", name: "Anthropic", supportsBaseUrl: false },
		{ id: "google-vertex", name: "Google Vertex AI", supportsBaseUrl: true },
		{ id: "inference.net", name: "Inference.net", supportsBaseUrl: true },
		{ id: "kluster.ai", name: "Kluster.ai", supportsBaseUrl: true },
	];

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			provider: "",
			key: "",
			baseUrl: "",
		},
	});

	const createProviderKey = $api.useMutation("post", "/keys/provider");

	async function onSubmit(values: FormValues) {
		setIsLoading(true);
		try {
			await createProviderKey.mutateAsync({
				body: {
					organizationId: organization!.id,
					provider: values.provider,
					token: values.key,
					baseUrl: values.baseUrl || undefined,
				},
			});
			setIsSuccess(true);
			toast({
				title: "Provider key added",
				description: "Your provider key has been added successfully.",
			});
		} catch (_error) {
			toast({
				title: "Error",
				description: "Failed to add provider key. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}

	const selectedProvider = form.watch("provider");
	const currentProvider = providers.find(
		(p: Provider) => p.id === selectedProvider,
	);

	return (
		<Step>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2 text-center">
					<h1 className="text-2xl font-bold">Add Provider Keys</h1>
					<p className="text-muted-foreground">
						Connect to your preferred LLM providers by adding their API keys.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5" />
							Provider Keys
						</CardTitle>
						<CardDescription>
							Add API keys for LLM providers like OpenAI, Anthropic, etc.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!isSuccess ? (
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-4"
								>
									<FormField
										control={form.control}
										name="provider"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Provider</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a provider" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{providers.map((provider: Provider) => (
															<SelectItem key={provider.id} value={provider.id}>
																{provider.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="key"
										render={({ field }) => (
											<FormItem>
												<FormLabel>API Key</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter your provider API key"
														type="password"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{currentProvider?.supportsBaseUrl && (
										<FormField
											control={form.control}
											name="baseUrl"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Base URL (Optional)</FormLabel>
													<FormControl>
														<Input
															placeholder="https://api.example.com"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Adding..." : "Add Provider Key"}
									</Button>
								</form>
							</Form>
						) : (
							<div className="flex flex-col gap-4">
								<div className="rounded-md bg-green-100 dark:bg-green-950 p-4">
									<p className="font-medium text-green-800 dark:text-green-300">
										Provider key added successfully!
									</p>
									<p className="mt-1 text-sm text-green-700 dark:text-green-400">
										You can add more provider keys later from the Provider Keys
										section.
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
