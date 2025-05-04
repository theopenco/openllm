import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	ArrowUpRight,
	Key,
	Plus,
	Zap,
} from "lucide-react";

import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";

export const Route = createFileRoute("/dashboard/_layout/")({
	component: Dashboard,
});

export default function Dashboard() {
	const session = useSession();

	console.log("session", session);

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
					<span>logged in as {session?.data?.user.email}</span>
					<div className="flex items-center space-x-2">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Provider
						</Button>
					</div>
				</div>
				<Tabs defaultValue="overview" className="space-y-4">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
					</TabsList>
					<TabsContent value="overview" className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Requests
									</CardTitle>
									<Zap className="text-muted-foreground h-4 w-4" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">2,543</div>
									<p className="text-muted-foreground text-xs">
										+12.5% from last month
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Tokens Used
									</CardTitle>
									<Activity className="text-muted-foreground h-4 w-4" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">1.2M</div>
									<p className="text-muted-foreground text-xs">
										+8.2% from last month
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Cost Estimate
									</CardTitle>
									<AlertCircle className="text-muted-foreground h-4 w-4" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">$24.50</div>
									<p className="text-muted-foreground text-xs">
										+2.5% from last month
									</p>
								</CardContent>
							</Card>
						</div>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							<Card className="col-span-4">
								<CardHeader>
									<CardTitle>Usage Overview</CardTitle>
								</CardHeader>
								<CardContent className="pl-2">
									<Overview />
								</CardContent>
							</Card>
							<Card className="col-span-3">
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Common tasks you might want to perform
									</CardDescription>
								</CardHeader>
								<CardContent className="grid gap-2">
									<Button variant="outline" className="justify-start">
										<Key className="mr-2 h-4 w-4" />
										Generate API Key
									</Button>
									<Button variant="outline" className="justify-start">
										<Plus className="mr-2 h-4 w-4" />
										Add Provider
									</Button>
									<Button variant="outline" className="justify-start">
										<ArrowUpRight className="mr-2 h-4 w-4" />
										View Documentation
									</Button>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
					<TabsContent value="activity" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>
									Your recent API requests and system events
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RecentActivity />
							</CardContent>
							<CardFooter>
								<Button variant="outline" className="w-full">
									View All Activity
								</Button>
							</CardFooter>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
