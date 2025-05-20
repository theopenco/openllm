import { createFileRoute } from "@tanstack/react-router";

import { CacheRateChart } from "@/components/usage/cache-rate-chart";
import { CostBreakdownChart } from "@/components/usage/cost-breakdown-chart";
import { ErrorRateChart } from "@/components/usage/error-rate-chart";
import { ModelUsageTable } from "@/components/usage/model-usage-table";
import { UsageChart } from "@/components/usage/usage-chart";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";

export const Route = createFileRoute("/dashboard/_layout/usage")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Usage & Metrics</h2>
				</div>
				<Tabs defaultValue="requests" className="space-y-4">
					<TabsList>
						<TabsTrigger value="requests">Requests</TabsTrigger>
						<TabsTrigger value="models">Models</TabsTrigger>
						<TabsTrigger value="errors">Errors</TabsTrigger>
						<TabsTrigger value="cache">Cache</TabsTrigger>
						<TabsTrigger value="costs">Costs</TabsTrigger>
					</TabsList>
					<TabsContent value="requests" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Request Volume</CardTitle>
								<CardDescription>
									Number of API requests over time
								</CardDescription>
							</CardHeader>
							<CardContent className="h-[400px]">
								<UsageChart />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="models" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Top Used Models</CardTitle>
								<CardDescription>Usage breakdown by model</CardDescription>
							</CardHeader>
							<CardContent>
								<ModelUsageTable />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="errors" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Error Rate</CardTitle>
								<CardDescription>
									API request error rate over time
								</CardDescription>
							</CardHeader>
							<CardContent className="h-[400px]">
								<ErrorRateChart />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="cache" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Cache Rate</CardTitle>
								<CardDescription>
									API request cache rate over time
								</CardDescription>
							</CardHeader>
							<CardContent className="h-[400px]">
								<CacheRateChart />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="costs" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Cost Breakdown</CardTitle>
								<CardDescription>
									Estimated costs by provider and model
								</CardDescription>
							</CardHeader>
							<CardContent className="h-[400px]">
								<CostBreakdownChart />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
