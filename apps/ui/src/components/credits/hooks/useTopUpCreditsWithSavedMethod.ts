import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/payments";

interface TopUpWithSavedMethodParams {
	amount: number;
	paymentMethodId: string;
}

export function useTopUpCreditsWithSavedMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			amount,
			paymentMethodId,
		}: TopUpWithSavedMethodParams): Promise<{ success: boolean }> => {
			const res = await fetch(`${API_BASE}/top-up-with-saved-method`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount, paymentMethodId }),
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to top up credits: ${errorText}`);
			}

			return await res.json();
		},
		onSuccess: () => {
			// Invalidate organization query to refresh credits
			queryClient.invalidateQueries({ queryKey: ["organization"] });
		},
	});
}
