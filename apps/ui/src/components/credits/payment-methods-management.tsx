import {
	CardElement,
	Elements,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Trash2, Plus } from "lucide-react";
import { useState } from "react";

import {
	useCreateSetupIntent,
	useDeletePaymentMethod,
	usePaymentMethods,
	useSetDefaultPaymentMethod,
} from "./hooks/usePaymentMethods";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import { toast } from "@/lib/components/use-toast";
import { loadStripeNow } from "@/lib/stripe";

import type React from "react";

const stripePromise = loadStripeNow();

export function PaymentMethodsManagement() {
	const { data, isLoading } = usePaymentMethods();
	const setDefaultMutation = useSetDefaultPaymentMethod();
	const deleteMutation = useDeletePaymentMethod();

	if (isLoading) {
		return <div>Loading payment methods...</div>;
	}

	const paymentMethods = data?.paymentMethods || [];

	const handleSetDefault = async (paymentMethodId: string) => {
		try {
			await setDefaultMutation.mutateAsync({ paymentMethodId });
			toast({
				title: "Success",
				description: "Default payment method updated",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (paymentMethodId: string) => {
		if (!confirm("Are you sure you want to delete this payment method?")) {
			return;
		}

		try {
			await deleteMutation.mutateAsync({ paymentMethodId });
			toast({
				title: "Success",
				description: "Payment method deleted",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-4">
			{paymentMethods.length === 0 ? (
				<div className="text-center p-4">
					<p className="text-muted-foreground">No payment methods added yet.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{paymentMethods.map((method) => (
						<div
							key={method.id}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								<CreditCard className="h-5 w-5" />
								<div>
									<p>
										{method.cardBrand} •••• {method.cardLast4}
									</p>
									<p className="text-sm text-muted-foreground">
										Expires {method.expiryMonth}/{method.expiryYear}
									</p>
								</div>
								{method.isDefault && (
									<span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
										Default
									</span>
								)}
							</div>
							<div className="flex gap-2">
								{!method.isDefault && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleSetDefault(method.id)}
										disabled={setDefaultMutation.isPending}
									>
										Set Default
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDelete(method.id)}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
			<AddPaymentMethodDialog />
		</div>
	);
}

function AddPaymentMethodDialog() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add Payment Method
				</Button>
			</DialogTrigger>
			<DialogContent>
				<Elements stripe={stripePromise}>
					<AddPaymentMethodForm onSuccess={() => setOpen(false)} />
				</Elements>
			</DialogContent>
		</Dialog>
	);
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
	const stripe = useStripe();
	const elements = useElements();
	const [loading, setLoading] = useState(false);
	const setupIntentMutation = useCreateSetupIntent();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setLoading(true);

		try {
			const { clientSecret } = await setupIntentMutation.mutateAsync();

			const result = await stripe.confirmCardSetup(clientSecret, {
				payment_method: {
					card: elements.getElement(CardElement)!,
				},
			});

			if (result.error) {
				toast({
					title: "Error",
					description: result.error.message,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Success",
					description: "Payment method added successfully",
				});
				onSuccess();
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>Add Payment Method</DialogTitle>
				<DialogDescription>
					Add a new card to your account for faster checkout.
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit}>
				<div className="space-y-4 py-4">
					<div className="border rounded-md p-3">
						<CardElement
							options={{
								style: {
									base: {
										fontSize: "16px",
										color: "#424770",
										"::placeholder": {
											color: "#aab7c4",
										},
									},
									invalid: {
										color: "#9e2146",
									},
								},
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit" disabled={!stripe || loading}>
						{loading ? "Adding..." : "Add Payment Method"}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}
