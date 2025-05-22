import * as React from "react";
import { useState } from "react";

import { useDefaultProject } from "@/hooks/useDefaultProject";
import { useUpdateProject } from "@/hooks/useProject";
import { Button } from "@/lib/components/button";
import { Label } from "@/lib/components/label";
import { RadioGroup, RadioGroupItem } from "@/lib/components/radio-group";
import { Separator } from "@/lib/components/separator";
import { useToast } from "@/lib/components/use-toast";

export function ProjectModeSettings() {
	const { toast } = useToast();
	const { data: defaultProject, isError } = useDefaultProject();
	const updateProject = useUpdateProject();

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
				id: defaultProject.id,
				settings: {
					mode,
				},
			});

			toast({
				title: "Settings saved",
				description: "Your project mode settings have been updated.",
			});
		} catch (error) {
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
					<div className="flex items-start space-x-2">
						<RadioGroupItem value="api-keys" id="api-keys" />
						<div className="space-y-1">
							<Label htmlFor="api-keys" className="font-medium">
								API Keys
							</Label>
							<p className="text-muted-foreground text-sm">
								Use your own provider API keys (OpenAI, Anthropic, etc.)
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-2">
						<RadioGroupItem value="credits" id="credits" />
						<div className="space-y-1">
							<Label htmlFor="credits" className="font-medium">
								Credits
							</Label>
							<p className="text-muted-foreground text-sm">
								Use your organization credits and our internal API keys
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-2">
						<RadioGroupItem value="hybrid" id="hybrid" />
						<div className="space-y-1">
							<Label htmlFor="hybrid" className="font-medium">
								Hybrid
							</Label>
							<p className="text-muted-foreground text-sm">
								Use your own API keys when available, fall back to credits when
								needed
							</p>
						</div>
					</div>
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
