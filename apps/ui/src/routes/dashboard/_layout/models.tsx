import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddProviderDialog } from "@/components/models/add-provider-dialog";
import { ProvidersList } from "@/components/models/providers-list";
import { Button } from "@/lib/components/button";
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

export const Route = createFileRoute("/dashboard/_layout/models")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">
						Models & Providers
					</h2>
					<AddProviderDialog>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Provider
						</Button>
					</AddProviderDialog>
				</div>
				<Tabs defaultValue="providers" className="space-y-4">
					<TabsList>
						<TabsTrigger value="providers">Providers</TabsTrigger>
						<TabsTrigger value="models">Models</TabsTrigger>
					</TabsList>
					<TabsContent value="providers" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Connected Providers</CardTitle>
								<CardDescription>
									Manage your LLM provider connections
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ProvidersList />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="models" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Available Models</CardTitle>
								<CardDescription>
									Models available through your connected providers
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									Models are automatically detected from your connected
									providers.
								</p>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
