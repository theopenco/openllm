import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

export async function addPasskey() {
	try {
		const { data, error } = await authClient.passkey.addPasskey();

		if (error) {
			toast({
				title: "Error adding passkey",
				description: error.message || "Please try again",
				variant: "destructive",
			});
			return;
		}

		if (data) {
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
