import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowUpRight,
	CreditCard,
	Key,
	KeyRound,
	Plus,
	Zap,
	Activity,
} from "lucide-react";
import { useState } from "react";

import { TopUpCreditsButton } from "@/components/credits/top-up-credits-dialog";
import { Overview } from "@/components/dashboard/overview";
import { useActivity } from "@/hooks/useActivity";
import { useDefaultOrganization } from "@/hooks/useOrganization";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Tabs, TabsList, TabsTrigger } from "@/lib/components/tabs";

export const Route = createFileRoute("/dashboard/_layout/")({
	component: Dashboard,
});

export default function Dashboard() {
	const navigate = useNavigate();
	const [days, setDays] = useState<7 | 30>(7);
	const { data, isLoading } = useActivity(days);
	const { data: organization, isLoading: isLoadingOrg } =
		useDefaultOrganization();

	// Calculate total stats from activity data
	const totalRequests =
		data?.reduce((sum, day) => sum + day.requestCount, 0) || 0;
	const totalTokens = data?.reduce((sum, day) => sum + day.totalTokens, 0) || 0;
	const totalCost = data?.reduce((sum, day) => sum + day.cost, 0) || 0;
	const totalInputCost =
		data?.reduce((sum, day) => sum + day.inputCost, 0) || 0;
	const totalOutputCost =
		data?.reduce((sum, day) => sum + day.outputCost, 0) || 0;

	// Format tokens for display (k for thousands, M for millions)
	const formatTokens = (tokens: number) => {
		if (tokens >= 1_000_000) {
			return `${(tokens / 1_000_000).toFixed(1)}M`;
		}
		if (tokens >= 1_000) {
			return `${(tokens / 1_000).toFixed(1)}k`;
		}
		return tokens.toString();
	};

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
					<div className="flex items-center space-x-2">
						<TopUpCreditsButton />
						<Button asChild>
							<Link to="/dashboard/provider-keys">
								<Plus className="mr-2 h-4 w-4" />
								Add Provider
							</Link>
						</Button>
					</div>
				</div>

				<Tabs
					defaultValue="7days"
					onValueChange={(value) => setDays(value === "7days" ? 7 : 30)}
					className="mb-2"
				>
					<TabsList>
						<TabsTrigger value="7days">Last 7 Days</TabsTrigger>
						<TabsTrigger value="30days">Last 30 Days</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Requests
								</CardTitle>
								<Zap className="text-muted-foreground h-4 w-4" />
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<>
										<div className="text-2xl font-bold">Loading...</div>
										<p className="text-muted-foreground text-xs">–</p>
									</>
								) : (
									<>
										<div className="text-2xl font-bold">
											{totalRequests.toLocaleString()}
										</div>
										<p className="text-muted-foreground text-xs">
											Last {days} days
											{data && data.length > 0 && (
												<span className="ml-1">
													•{" "}
													{(
														data.reduce((sum, day) => sum + day.cacheRate, 0) /
														data.length
													).toFixed(1)}
													% cached
												</span>
											)}
										</p>
									</>
								)}
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
								{isLoading ? (
									<>
										<div className="text-2xl font-bold">Loading...</div>
										<p className="text-muted-foreground text-xs">–</p>
									</>
								) : (
									<>
										<div className="text-2xl font-bold">
											{formatTokens(totalTokens)}
										</div>
										<p className="text-muted-foreground text-xs">
											Last {days} days
										</p>
									</>
								)}
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
								{isLoading ? (
									<>
										<div className="text-2xl font-bold">Loading...</div>
										<p className="text-muted-foreground text-xs">–</p>
									</>
								) : (
									<>
										<div className="text-2xl font-bold">
											${totalCost.toFixed(2)}
										</div>
										<p className="text-muted-foreground text-xs">
											<span>${totalInputCost.toFixed(2)} input</span>
											&nbsp;+&nbsp;
											<span>${totalOutputCost.toFixed(2)} output</span>
										</p>
									</>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Organization Credits
								</CardTitle>
								<CreditCard className="text-muted-foreground h-4 w-4" />
							</CardHeader>
							<CardContent>
								{isLoadingOrg ? (
									<>
										<div className="text-2xl font-bold">Loading...</div>
										<p className="text-muted-foreground text-xs">–</p>
									</>
								) : (
									<>
										<div className="text-2xl font-bold truncate overflow-ellipsis">
											${Number(organization?.credits).toFixed(8)}
										</div>
										<p className="text-muted-foreground text-xs">
											Available balance
										</p>
									</>
								)}
							</CardContent>
						</Card>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>Usage Overview</CardTitle>
								<CardDescription>Total Requests</CardDescription>
							</CardHeader>
							<CardContent className="pl-2">
								<Overview data={data} isLoading={isLoading} days={days} />
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
								<Button
									variant="outline"
									className="justify-start"
									onClick={() => navigate({ to: "/dashboard/api-keys" })}
								>
									<Key className="mr-2 h-4 w-4" />
									Generate API Key
								</Button>
								<Button
									variant="outline"
									className="justify-start"
									onClick={() => navigate({ to: "/dashboard/provider-keys" })}
								>
									<KeyRound className="mr-2 h-4 w-4" />
									Add Provider Key
								</Button>
								<Button
									variant="outline"
									className="justify-start"
									onClick={() => navigate({ to: "/dashboard/models" })}
								>
									<Plus className="mr-2 h-4 w-4" />
									Add Provider
								</Button>
								<Button variant="outline" className="justify-start" asChild>
									<a href="https://docs.llmgateway.io/" target="_blank">
										<ArrowUpRight className="mr-2 h-4 w-4" />
										View Documentation
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
