import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

export async function addPasskey() {
	try {
		const result = await authClient.passkey.addPasskey();

		if (result?.error) {
			toast({
				title: "Error adding passkey",
				description: result.error.message || "Please try again",
				variant: "destructive",
			});
			return;
		}

		if (result?.data) {
			toast({
				title: "Passkey added",
				description: "You can now sign in using your passkey",
			});
		}
	} catch (error) {
		toast({
			title: "Error adding passkey",
			description: "An unexpected error occurred",
			variant: "destructive",
		});
	}
}
