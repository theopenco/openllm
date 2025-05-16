import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";

import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentLogs } from "@/components/dashboard/recent-logs";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/activity")({
	component: ActivityPage,
});

function RefreshButton() {
	const queryClient = useQueryClient();

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => queryClient.invalidateQueries({ queryKey: ["logs"] })}
			title="Refresh logs"
		>
			<RefreshCw className="h-4 w-4" />
		</Button>
	);
}

function ActivityPage() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Activity</h2>
				</div>
				<div className="space-y-4">
					<ActivityChart />
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>
									Your recent API requests and system events
								</CardDescription>
							</div>
							<RefreshButton />
						</CardHeader>
						<CardContent>
							<RecentLogs />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
