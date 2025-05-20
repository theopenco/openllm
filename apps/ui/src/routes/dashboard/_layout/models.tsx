import { createFileRoute } from "@tanstack/react-router";

import { ModelsList } from "@/components/models/models-list";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/models")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Models</h2>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Available Models</CardTitle>
						<CardDescription>
							Models available through your connected providers
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ModelsList />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
