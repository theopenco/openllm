import { Copy, MoreHorizontal } from "lucide-react";
import { useState } from "react";

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

const apiKeys = [
	{
		id: "1",
		name: "Production API Key",
		key: "llmgw_prod_a1b2c3d4e5f6g7h8i9j0",
		created: "2023-10-15",
		lastUsed: "2 minutes ago",
		status: "active",
		restrictions: "None",
	},
	{
		id: "2",
		name: "Development API Key",
		key: "llmgw_dev_z9y8x7w6v5u4t3s2r1q0",
		created: "2023-11-20",
		lastUsed: "3 days ago",
		status: "active",
		restrictions: "IP: 192.168.1.0/24",
	},
	{
		id: "3",
		name: "Testing API Key",
		key: "llmgw_test_j0i9h8g7f6e5d4c3b2a1",
		created: "2024-01-05",
		lastUsed: "1 week ago",
		status: "inactive",
		restrictions: "None",
	},
];

export function ApiKeysList() {
	const [keys, setKeys] = useState(apiKeys);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast({
			title: "API Key Copied",
			description: "The API key has been copied to your clipboard.",
		});
	};

	const deleteKey = (id: string) => {
		setKeys(keys.filter((key) => key.id !== id));
		toast({
			title: "API Key Deleted",
			description: "The API key has been permanently deleted.",
		});
	};

	const toggleStatus = (id: string) => {
		setKeys(
			keys.map((key) =>
				key.id === id
					? { ...key, status: key.status === "active" ? "inactive" : "active" }
					: key,
			),
		);
		toast({
			title: "API Key Status Updated",
			description: "The API key status has been updated.",
		});
	};

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
				{keys.map((key) => (
					<TableRow key={key.id}>
						<TableCell className="font-medium">{key.name}</TableCell>
						<TableCell>
							<div className="flex items-center space-x-2">
								<span className="font-mono text-xs">
									{key.key.substring(0, 8)}•••••••••••
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => copyToClipboard(key.key)}
								>
									<Copy className="h-3 w-3" />
									<span className="sr-only">Copy API key</span>
								</Button>
							</div>
						</TableCell>
						<TableCell>{key.created}</TableCell>
						<TableCell>{key.lastUsed}</TableCell>
						<TableCell>
							<Badge
								variant={key.status === "active" ? "default" : "secondary"}
							>
								{key.status}
							</Badge>
						</TableCell>
						<TableCell>{key.restrictions}</TableCell>
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
									<DropdownMenuItem onClick={() => copyToClipboard(key.key)}>
										Copy API Key
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => toggleStatus(key.id)}>
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
