import { KeyIcon, MoreHorizontal, PlusIcon } from "lucide-react";

import { CreateApiKeyDialog } from "./create-api-key-dialog";
import {
	useApiKeys,
	useDeleteApiKey,
	useToggleApiKeyStatus,
} from "./hooks/useApiKeys";
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

export function ApiKeysList() {
	const { data } = useApiKeys();
	const deleteMutation = useDeleteApiKey();
	const toggleMutation = useToggleApiKeyStatus();

	const keys = data?.apiKeys;

	const deleteKey = (id: string) => {
		deleteMutation.mutate(id);
	};

	const toggleStatus = (id: string, currentStatus: string) => {
		const newStatus = currentStatus === "active" ? "inactive" : "active";
		toggleMutation.mutate({ id, status: newStatus });
		toast({
			title: "API Key Status Updated",
			description: "The API key status has been updated.",
		});
	};

	// const copyToClipboard = (text: string) => {
	// 	navigator.clipboard.writeText(text);
	// 	toast({
	// 		title: "API Key Copied",
	// 		description: "The API key has been copied to your clipboard.",
	// 	});
	// };

	if (keys!.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">No API keys have been created yet.</p>
				<CreateApiKeyDialog>
					<Button
						type="button"
						className="cursor-pointer flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200"
					>
						<PlusIcon className="h-5 w-5" />
						Create API Key
					</Button>
				</CreateApiKeyDialog>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>API Key</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Last Used</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Restrictions</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{keys!.map((key) => (
					<TableRow key={key.id}>
						<TableCell className="font-medium">{key.description}</TableCell>
						<TableCell>
							<div className="flex items-center space-x-2">
								<span className="font-mono text-xs">{key.maskedToken}</span>
								{/* <Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => copyToClipboard(key.id)}
								>
									<Copy className="h-3 w-3" />
									<span className="sr-only">Copy API key</span>
								</Button> */}
							</div>
						</TableCell>
						<TableCell>{key.createdAt}</TableCell>
						<TableCell>{key.updatedAt}</TableCell>
						<TableCell>
							<Badge
								variant={key.status === "active" ? "default" : "secondary"}
							>
								{key.status}
							</Badge>
						</TableCell>
						<TableCell>key.restrictions</TableCell>
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
									{/* <DropdownMenuItem onClick={() => copyToClipboard(key.key)}>
										Copy API Key
									</DropdownMenuItem> */}
									<DropdownMenuItem
										onClick={() => toggleStatus(key.id, key.status)}
									>
										{key.status === "active" ? "Disable" : "Enable"} Key
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
												<span className="text-destructive">Delete Key</span>
											</DropdownMenuItem>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Are you absolutely sure?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently
													delete the API key and any applications using it will
													no longer be able to access the API.
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
				))}
			</TableBody>
		</Table>
	);
}
