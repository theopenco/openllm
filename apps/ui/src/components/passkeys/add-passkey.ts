import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

import type { QueryClient } from "@tanstack/react-query";

export async function addPasskey(queryClient: QueryClient) {
	try {
		const result = await authClient.passkey.addPasskey({
			authenticatorAttachment: "cross-platform",
		});

		if (result?.error) {
			toast({
				title: "Error adding passkey",
				description: result.error.message || "Please try again",
				variant: "destructive",
				className: "text-white",
			});
			return;
		}

		toast({
			title: "Passkey added",
			description: "You can now sign in using your passkey",
		});

		queryClient.refetchQueries({ queryKey: ["passkeys"] });
	} catch {
		toast({
			title: "Error adding passkey",
			description: "An unexpected error occurred",
			variant: "destructive",
			className: "text-white",
		});
	}
}
