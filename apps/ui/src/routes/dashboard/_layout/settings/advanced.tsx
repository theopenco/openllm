import { createFileRoute } from "@tanstack/react-router";

import { SettingsLoading } from "@/components/settings/settings-loading";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/settings/advanced")({
	component: RouteComponent,
	pendingComponent: () => <SettingsLoading />,
	errorComponent: ({ error }) => <div>{error.message}</div>,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">
						Advanced Settings
					</h2>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Advanced Settings</CardTitle>
						<CardDescription>
							Configure advanced system settings
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<p className="text-muted-foreground text-sm">
							Advanced settings are available in the configuration file.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
