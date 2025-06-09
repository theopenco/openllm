import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

export async function addPasskey() {
	try {
		const result = await authClient.passkey.addPasskey({
			authenticatorAttachment: "cross-platform",
		});

		if (result?.error) {
			toast({
				title: "Error adding passkey",
				description: result.error.message || "Please try again",
			});
			return;
		}

		toast({
			title: "Passkey added",
			description: "You can now sign in using your passkey",
		});
	} catch {
		toast({
			title: "Error adding passkey",
			description: "An unexpected error occurred",
			variant: "destructive",
		});
	}
}
