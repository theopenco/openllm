import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useState } from "react";

import { useDefaultProject } from "@/hooks/useDefaultProject";
import { Button } from "@/lib/components/button";
import { Label } from "@/lib/components/label";
import { RadioGroup, RadioGroupItem } from "@/lib/components/radio-group";
import { Separator } from "@/lib/components/separator";
import { useToast } from "@/lib/components/use-toast";
import { $api } from "@/lib/fetch-client";

export function ProjectModeSettings() {
	const { toast } = useToast();
	const { data: defaultProject, isError } = useDefaultProject();
	const queryClient = useQueryClient();

	const updateProject = $api.useMutation("patch", "/projects/{id}", {
		onSuccess: (data) => {
			const queryKey = $api.queryOptions("get", "/orgs/{id}/projects", {
				params: { path: { id: data.project.organizationId } },
			}).queryKey;
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const [mode, setMode] = useState<"api-keys" | "credits" | "hybrid">(
		defaultProject?.mode || "api-keys",
	);

	if (isError || !defaultProject) {
		return (
			<div className="space-y-2">
				<h3 className="text-lg font-medium">Project Mode</h3>
				<p className="text-muted-foreground text-sm">
					Unable to load project settings.
				</p>
			</div>
		);
	}

	const handleSave = async () => {
		try {
			await updateProject.mutateAsync({
				params: { path: { id: defaultProject.id } },
				body: { mode },
			});

			toast({
				title: "Settings saved",
				description: "Your project mode settings have been updated.",
			});
		} catch {
			toast({
				title: "Error",
				description: "Failed to save project mode settings.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-medium">Project Mode</h3>
				<p className="text-muted-foreground text-sm">
					Configure how your project consumes LLM services
				</p>
			</div>

			<Separator />

			<div className="space-y-4">
				<RadioGroup
					value={mode}
					onValueChange={(value: "api-keys" | "credits" | "hybrid") =>
						setMode(value)
					}
					className="space-y-2"
				>
					{[
						{
							id: "api-keys",
							label: "API Keys",
							desc: "Use your own provider API keys (OpenAI, Anthropic, etc.)",
						},
						{
							id: "credits",
							label: "Credits",
							desc: "Use your organization credits and our internal API keys",
						},
						{
							id: "hybrid",
							label: "Hybrid",
							desc: "Use your own API keys when available, fall back to credits when needed",
						},
					].map(({ id, label, desc }) => (
						<div key={id} className="flex items-start space-x-2">
							<RadioGroupItem value={id} id={id} />
							<div className="space-y-1">
								<Label htmlFor={id} className="font-medium">
									{label}
								</Label>
								<p className="text-muted-foreground text-sm">{desc}</p>
							</div>
						</div>
					))}
				</RadioGroup>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={updateProject.isPending}>
					{updateProject.isPending ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}
