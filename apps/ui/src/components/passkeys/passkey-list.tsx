import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, KeySquare, Trash2 } from "lucide-react";

import { Button } from "@/lib/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";
import { toast } from "@/lib/components/use-toast";

import type { Passkey } from "./types";

async function fetchPasskeys(): Promise<Passkey[]> {
	const response = await fetch("/api/content/user/me/passkeys");
	if (!response.ok) {
		throw new Error("Failed to fetch passkeys");
	}
	const data = await response.json();
	return data.passkeys;
}

async function deletePasskeyRequest(id: string): Promise<void> {
	const response = await fetch(`/api/content/user/me/passkeys/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete passkey");
	}
}

export function PasskeyList() {
	const queryClient = useQueryClient();

	const {
		data: passkeys = [],
		isLoading,
		isError,
	} = useQuery<Passkey[]>({
		queryKey: ["passkeys"],
		queryFn: fetchPasskeys,
	});

	const {
		mutate: deletePasskey,
		isPending: isDeleting,
		variables: deletingId,
	} = useMutation({
		mutationFn: deletePasskeyRequest,
		onSuccess: (_, id) => {
			toast({
				title: "Passkey deleted",
				description: "Your passkey has been removed.",
			});
			queryClient.setQueryData<Passkey[]>(
				["passkeys"],
				(old) => old?.filter((p) => p.id !== id) ?? [],
			);
		},
		onError: () => {
			toast({
				title: "Error deleting passkey",
				variant: "destructive",
				className: "text-white",
			});
		},
	});

	if (isLoading) {
		return (
			<div className="flex justify-center items-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-center py-4 text-destructive">
				<p>Failed to load passkeys.</p>
			</div>
		);
	}

	if (passkeys.length === 0) {
		return (
			<div className="text-center py-4">
				<KeySquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
				<p className="text-muted-foreground">No passkeys found</p>
				<p className="text-sm text-muted-foreground">
					Add a passkey to enable passwordless login
				</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Device</TableHead>
					<TableHead>Added</TableHead>
					<TableHead className="w-[100px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{passkeys.map((passkey) => (
					<TableRow key={passkey.id}>
						<TableCell className="font-medium">
							{passkey.name || passkey.deviceType || "Unknown device"}
						</TableCell>
						<TableCell>
							{formatDistanceToNow(new Date(passkey.createdAt), {
								addSuffix: true,
							})}
						</TableCell>
						<TableCell>
							<Button
								variant="ghost"
								size="icon"
								disabled={isDeleting && deletingId === passkey.id}
								onClick={() => deletePasskey(passkey.id)}
							>
								{isDeleting && deletingId === passkey.id ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4" />
								)}
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
