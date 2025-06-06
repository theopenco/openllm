import { createFileRoute } from "@tanstack/react-router";

import { CachingSettings } from "@/components/settings/caching-settings";
import { ProjectModeSettings } from "@/components/settings/project-mode-settings";
import { SettingsLoading } from "@/components/settings/settings-loading";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Separator } from "@/lib/components/separator";

export const Route = createFileRoute("/dashboard/_layout/settings/preferences")(
	{
		component: RouteComponent,
		pendingComponent: () => <SettingsLoading />,
		errorComponent: ({ error }) => <div>{error.message}</div>,
	},
);

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Preferences</h2>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
						<CardDescription>Configure application preferences</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<ProjectModeSettings />
						<Separator className="my-6" />
						<CachingSettings />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
