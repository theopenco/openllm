import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/payments";

interface TopUpCreditsParams {
	amount: number;
}

interface TopUpCreditsResponse {
	clientSecret: string;
}

export function useTopUpCredits() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			amount,
		}: TopUpCreditsParams): Promise<TopUpCreditsResponse> => {
			const res = await fetch(`${API_BASE}/create-payment-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount }),
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to create payment intent: ${errorText}`);
			}

			return await res.json();
		},
		onSuccess: () => {
			// Invalidate organization query to refresh credits
			queryClient.invalidateQueries({ queryKey: ["organization"] });
		},
	});
}
