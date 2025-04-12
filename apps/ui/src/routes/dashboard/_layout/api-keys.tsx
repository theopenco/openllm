import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { ApiKeysList } from "@/components/api-keys/api-keys-list";
import { CreateApiKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/api-keys")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
					<CreateApiKeyDialog>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create API Key
						</Button>
					</CreateApiKeyDialog>
				</div>
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Your API Keys</CardTitle>
							<CardDescription>
								Manage your API keys for accessing OpenLLM
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ApiKeysList />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
