import { providers, type ProviderId } from "@llmgateway/models";
import { useQueryClient } from "@tanstack/react-query";
import { KeyIcon, MoreHorizontal, PlusIcon } from "lucide-react";

import { CreateProviderKeyDialog } from "./create-provider-key-dialog";
import { providerLogoComponents } from "@/components/provider-keys/provider-logo";
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
import { $api } from "@/lib/fetch-client";

export function ProviderKeysList() {
	const queryClient = useQueryClient();

	const { data } = $api.useSuspenseQuery("get", "/keys/provider");
	const deleteMutation = $api.useMutation("delete", "/keys/provider/{id}");
	const toggleMutation = $api.useMutation("patch", "/keys/provider/{id}");

	const queryKey = $api.queryOptions("get", "/keys/provider").queryKey;

	const keys = data?.providerKeys.filter((key) => key.status !== "deleted");

	const deleteKey = (id: string) => {
		deleteMutation.mutate(
			{ params: { path: { id } } },
			{
				onSuccess: () => {
					toast({ title: "Deleted", description: "Provider key removed" });

					void queryClient.invalidateQueries({ queryKey });
				},
				onError: () =>
					toast({
						title: "Error",
						description: "Failed to delete key",
						variant: "destructive",
					}),
			},
		);
	};

	const toggleStatus = (
		id: string,
		currentStatus: "active" | "inactive" | "deleted" | null,
	) => {
		const newStatus = currentStatus === "active" ? "inactive" : "active";

		toggleMutation.mutate(
			{
				params: { path: { id } },
				body: { status: newStatus },
			},
			{
				onSuccess: () => {
					toast({
						title: "Status Updated",
						description: `Provider key marked as ${newStatus}`,
					});

					queryClient.invalidateQueries({ queryKey });
				},
				onError: () =>
					toast({
						title: "Error",
						description: "Failed to update status",
						variant: "destructive",
					}),
			},
		);
	};

	// Get provider name from provider ID
	const getProviderName = (providerId: string) => {
		const provider = providers.find((p) => p.id === providerId);
		return provider ? provider.name : providerId;
	};

	if (keys && keys.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">
					No provider keys have been created yet.
				</p>
				<CreateProviderKeyDialog>
					<Button
						type="button"
						className="cursor-pointer flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200"
					>
						<PlusIcon className="h-5 w-5" />
						Add Provider Key
					</Button>
				</CreateProviderKeyDialog>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Provider</TableHead>
					<TableHead>API Key</TableHead>
					<TableHead>Base URL</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Last Updated</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{keys &&
					keys.map((key) => {
						const Logo = providerLogoComponents[key.provider as ProviderId];

						return (
							<TableRow key={key.id}>
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										{Logo && <Logo className="h-4 w-4 text-white" />}
										{getProviderName(key.provider)}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center space-x-2">
										<span className="font-mono text-xs">{key.maskedToken}</span>
									</div>
								</TableCell>
								<TableCell>{key.baseUrl || "-"}</TableCell>
								<TableCell>
									{new Date(key.createdAt).toLocaleString()}
								</TableCell>
								<TableCell>
									{new Date(key.updatedAt).toLocaleString()}
								</TableCell>
								<TableCell>
									<Badge
										variant={key.status === "active" ? "default" : "secondary"}
									>
										{key.status}
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
											<DropdownMenuItem
												onClick={() => toggleStatus(key.id, key.status)}
											>
												{key.status === "active" ? "Deactivate" : "Activate"}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<DropdownMenuItem
														onSelect={(e) => e.preventDefault()}
														className="text-destructive focus:text-destructive"
													>
														Delete
													</DropdownMenuItem>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Are you absolutely sure?
														</AlertDialogTitle>
														<AlertDialogDescription>
															This action cannot be undone. This will
															permanently delete your provider key.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => deleteKey(key.id)}
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
						);
					})}
			</TableBody>
		</Table>
	);
}
