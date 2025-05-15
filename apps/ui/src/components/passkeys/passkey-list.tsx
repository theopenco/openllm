import { formatDistanceToNow } from "date-fns";
import { Loader2, KeySquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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

interface Passkey {
	id: string;
	name: string | null;
	deviceType: string | null;
	createdAt: string;
}

export function PasskeyList() {
	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState<string | null>(null);

	const fetchPasskeys = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/user/me/passkeys");
			if (response.ok) {
				const data = await response.json();
				setPasskeys(data.passkeys);
			} else {
				toast({
					title: "Error fetching passkeys",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error fetching passkeys",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const deletePasskey = async (id: string) => {
		setDeleting(id);
		try {
			const response = await fetch(`/api/user/me/passkeys/${id}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setPasskeys((prev) => prev.filter((passkey) => passkey.id !== id));
				toast({
					title: "Passkey deleted",
					description: "Your passkey has been removed.",
				});
			} else {
				toast({
					title: "Error deleting passkey",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error deleting passkey",
				variant: "destructive",
			});
		} finally {
			setDeleting(null);
		}
	};

	useEffect(() => {
		fetchPasskeys();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	return (
		<div>
			{passkeys.length === 0 ? (
				<div className="text-center py-4">
					<KeySquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
					<p className="text-muted-foreground">No passkeys found</p>
					<p className="text-sm text-muted-foreground">
						Add a passkey to enable passwordless login
					</p>
				</div>
			) : (
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
										disabled={deleting === passkey.id}
										onClick={() => deletePasskey(passkey.id)}
									>
										{deleting === passkey.id ? (
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
			)}
		</div>
	);
}
