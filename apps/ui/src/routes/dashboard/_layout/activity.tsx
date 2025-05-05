import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentLogs } from "@/components/dashboard/recent-logs";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/activity")({
	component: ActivityPage,
});

function ActivityPage() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Activity</h2>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Data
					</Button>
				</div>
				<div className="space-y-4">
					<ActivityChart />
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>
								Your recent API requests and system events
							</CardDescription>
						</CardHeader>
						<CardContent>
							<RecentLogs />
						</CardContent>
						<CardFooter>
							<Button variant="outline" className="w-full">
								View All Logs
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		</div>
	);
}
