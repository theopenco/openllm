import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	Plus,
	Zap,
	Activity as ActivityIcon, // Renamed to avoid conflict
} from "lucide-react";
import React from "react";
import { useState } from "react";

import { Overview } from "@/components/dashboard/overview";
import { useActivity } from "@/hooks/useActivity"; // Import DailyActivity
import { useSession } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";

import type { DailyActivity } from "@/hooks/useActivity";

export const Route = createFileRoute("/dashboard/_layout/")({
	component: Dashboard,
});

export default function Dashboard() {
	const navigate = useNavigate();
	const session = useSession();
	const [days, setDays] = useState<number>(7);
	const activityQuery = useActivity(days);

	if (!session.data?.user.id && !session.isPending) {
		navigate({ to: "/login" });
	}

	const totalRequests =
		activityQuery.data?.reduce(
			(acc: number, curr: DailyActivity) => acc + curr.requestCount,
			0,
		) ?? 0;
	const totalTokens =
		activityQuery.data?.reduce(
			(acc: number, curr: DailyActivity) => acc + curr.totalTokens,
			0,
		) ?? 0;
	const totalCost =
		activityQuery.data?.reduce(
			(acc: number, curr: DailyActivity) => acc + curr.cost,
			0,
		) ?? 0;

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
					<div className="flex items-center space-x-2">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Provider
						</Button>
					</div>
				</div>
				<Tabs
					defaultValue="7"
					onValueChange={(value: string) => setDays(Number(value))}
				>
					<TabsList className="grid w-full grid-cols-2 md:w-1/4">
						<TabsTrigger value="7">7 Days</TabsTrigger>
						<TabsTrigger value="30">30 Days</TabsTrigger>
					</TabsList>
					<TabsContent value="7">
						<div className="space-y-4 mt-4">
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Total Requests
										</CardTitle>
										<Zap className="text-muted-foreground h-4 w-4" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{activityQuery.isLoading ? "Loading..." : totalRequests}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+12.5% from last month
										</p> */}
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Tokens Used
										</CardTitle>
										<ActivityIcon className="text-muted-foreground h-4 w-4" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{activityQuery.isLoading ? "Loading..." : totalTokens}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+8.2% from last month
										</p> */}
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
										<div className="text-2xl font-bold">
											{activityQuery.isLoading
												? "Loading..."
												: `$${totalCost.toFixed(2)}`}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+2.5% from last month
										</p> */}
									</CardContent>
								</Card>
							</div>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
								<Card className="col-span-4">
									<CardHeader>
										<CardTitle>Usage Overview</CardTitle>
									</CardHeader>
									<CardContent className="pl-2">
										<Overview data={activityQuery.data} />
									</CardContent>
								</Card>
								<Card className="col-span-3">{/* ...existing code... */}</Card>
							</div>
						</div>
					</TabsContent>
					<TabsContent value="30">
						<div className="space-y-4 mt-4">
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Total Requests
										</CardTitle>
										<Zap className="text-muted-foreground h-4 w-4" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{activityQuery.isLoading ? "Loading..." : totalRequests}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+12.5% from last month
										</p> */}
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Tokens Used
										</CardTitle>
										<ActivityIcon className="text-muted-foreground h-4 w-4" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{activityQuery.isLoading ? "Loading..." : totalTokens}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+8.2% from last month
										</p> */}
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
										<div className="text-2xl font-bold">
											{activityQuery.isLoading
												? "Loading..."
												: `$${totalCost.toFixed(2)}`}
										</div>
										{/* <p className="text-muted-foreground text-xs">
											+2.5% from last month
										</p> */}
									</CardContent>
								</Card>
							</div>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
								<Card className="col-span-4">
									<CardHeader>
										<CardTitle>Usage Overview</CardTitle>
									</CardHeader>
									<CardContent className="pl-2">
										<Overview data={activityQuery.data} />
									</CardContent>
								</Card>
								<Card className="col-span-3">{/* ...existing code... */}</Card>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
