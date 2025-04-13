"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useState } from "react";

import { EditProviderDialog } from "@/components/models/edit-provider-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/lib/components/alert-dialog";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/lib/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";
import { toast } from "@/lib/components/use-toast";

const providers = [
	{
		id: "1",
		name: "OpenAI",
		baseUrl: "https://api.openai.com/v1",
		models: ["gpt-4o", "gpt-3.5-turbo"],
		status: "connected",
		priority: "high",
	},
	{
		id: "2",
		name: "Anthropic",
		baseUrl: "https://api.anthropic.com/v1",
		models: ["claude-3-sonnet", "claude-3-haiku"],
		status: "connected",
		priority: "medium",
	},
	{
		id: "3",
		name: "Mistral AI",
		baseUrl: "https://api.mistral.ai/v1",
		models: ["mistral-large", "mistral-small"],
		status: "connected",
		priority: "low",
	},
	{
		id: "4",
		name: "Meta",
		baseUrl: "https://llama.meta.ai/v1",
		models: ["llama-3-70b", "llama-3-8b"],
		status: "disconnected",
		priority: "low",
	},
];

export function ProvidersList() {
	const [providersList, setProvidersList] = useState(providers);
	const [editingProvider, setEditingProvider] = useState<
		(typeof providers)[0] | null
	>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const deleteProvider = (id: string) => {
		setProvidersList(providersList.filter((provider) => provider.id !== id));
		toast({
			title: "Provider Deleted",
			description: "The provider has been removed from your gateway.",
		});
	};

	const editProvider = (provider: (typeof providers)[0]) => {
		setEditingProvider(provider);
		setEditDialogOpen(true);
	};

	const saveProvider = (updatedProvider: (typeof providers)[0]) => {
		setProvidersList(
			providersList.map((provider) =>
				provider.id === updatedProvider.id ? updatedProvider : provider,
			),
		);
		toast({
			title: "Provider Updated",
			description: "The provider settings have been updated.",
		});
		setEditDialogOpen(false);
		setEditingProvider(null);
	};

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Provider</TableHead>
						<TableHead>Base URL</TableHead>
						<TableHead>Models</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{providersList.map((provider) => (
						<TableRow key={provider.id}>
							<TableCell className="font-medium">{provider.name}</TableCell>
							<TableCell className="font-mono text-xs">
								{provider.baseUrl}
							</TableCell>
							<TableCell>{provider.models.join(", ")}</TableCell>
							<TableCell>
								<Badge
									variant={
										provider.status === "connected" ? "default" : "secondary"
									}
								>
									{provider.status}
								</Badge>
							</TableCell>
							<TableCell>
								<Badge
									variant="outline"
									className={
										provider.priority === "high"
											? "border-green-500 text-green-500"
											: provider.priority === "medium"
												? "border-yellow-500 text-yellow-500"
												: "border-gray-500 text-gray-500"
									}
								>
									{provider.priority}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" />
											<span className="sr-only">Open menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuItem onClick={() => editProvider(provider)}>
											<Edit className="mr-2 h-4 w-4" />
											Edit Provider
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													<Trash className="mr-2 h-4 w-4" />
													<span className="text-destructive">
														Delete Provider
													</span>
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Are you absolutely sure?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This action cannot be undone. This will permanently
														delete the provider configuration and remove it from
														your gateway.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => deleteProvider(provider.id)}
														className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{editingProvider && (
				<EditProviderDialog
					provider={editingProvider}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSave={saveProvider}
				/>
			)}
		</>
	);
}
