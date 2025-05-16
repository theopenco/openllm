import * as React from "react";
import { useState } from "react";

import { useDefaultProject } from "@/hooks/useDefaultProject";
import { useUpdateProject } from "@/hooks/useProject";
import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Separator } from "@/lib/components/separator";
import { useToast } from "@/lib/components/use-toast";

export function CachingSettings() {
	const { toast } = useToast();
	const { data: defaultProject, isError } = useDefaultProject();
	const updateProject = useUpdateProject();

	const [cachingEnabled, setCachingEnabled] = useState(
		defaultProject?.cachingEnabled || false,
	);
	const [cacheDurationSeconds, setCacheDurationSeconds] = useState(
		defaultProject?.cacheDurationSeconds || 60,
	);

	if (isError || !defaultProject) {
		return (
			<div className="space-y-2">
				<h3 className="text-lg font-medium">Request Caching</h3>
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
					cachingEnabled,
					cacheDurationSeconds,
				},
			});

			toast({
				title: "Settings saved",
				description: "Your caching settings have been updated.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to save caching settings.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-medium">Request Caching</h3>
				<p className="text-muted-foreground text-sm">
					Configure caching for identical LLM requests
				</p>
			</div>

			<Separator />

			<div className="flex items-center space-x-2">
				<Checkbox
					id="caching-enabled"
					checked={cachingEnabled}
					onCheckedChange={(checked) => setCachingEnabled(checked === true)}
				/>
				<Label htmlFor="caching-enabled">Enable request caching</Label>
			</div>

			<div className="space-y-2">
				<Label htmlFor="cache-duration">Cache Duration (seconds)</Label>
				<div className="flex space-x-2">
					<Input
						id="cache-duration"
						type="number"
						min={10}
						max={31536000}
						value={cacheDurationSeconds}
						onChange={(e) =>
							setCacheDurationSeconds(parseInt(e.target.value, 10))
						}
						disabled={!cachingEnabled}
						className="w-32"
					/>
					<p className="text-muted-foreground text-sm self-center">
						(Min: 10, Max: 31,536,000 - one year)
					</p>
				</div>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={updateProject.isPending}>
					{updateProject.isPending ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}
