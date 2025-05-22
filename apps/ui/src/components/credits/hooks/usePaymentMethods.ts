import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/payments";

interface PaymentMethod {
	id: string;
	stripePaymentMethodId: string;
	type: string;
	isDefault: boolean;
	cardBrand?: string;
	cardLast4?: string;
	expiryMonth?: number;
	expiryYear?: number;
}

interface PaymentMethodResponse {
	paymentMethods: PaymentMethod[];
}

export function usePaymentMethods() {
	return useQuery({
		queryKey: ["paymentMethods"],
		queryFn: async (): Promise<PaymentMethodResponse> => {
			const res = await fetch(`${API_BASE}/payment-methods`, {
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to fetch payment methods: ${errorText}`);
			}

			return await res.json();
		},
	});
}

export function useSetDefaultPaymentMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			paymentMethodId,
		}: {
			paymentMethodId: string;
		}): Promise<void> => {
			const res = await fetch(`${API_BASE}/payment-methods/default`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentMethodId }),
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to set default payment method: ${errorText}`);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
		},
	});
}

export function useDeletePaymentMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			paymentMethodId,
		}: {
			paymentMethodId: string;
		}): Promise<void> => {
			const res = await fetch(
				`${API_BASE}/payment-methods/${paymentMethodId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to delete payment method: ${errorText}`);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
		},
	});
}

export function useCreateSetupIntent() {
	return useMutation({
		mutationFn: async (): Promise<{ clientSecret: string }> => {
			const res = await fetch(`${API_BASE}/create-setup-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to create setup intent: ${errorText}`);
			}

			return await res.json();
		},
	});
}
