import {
	CardElement,
	Elements,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useTopUpCredits } from "./hooks/useTopUpCredits";
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
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { toast } from "@/lib/components/use-toast";

import type React from "react";

const stripePromise = loadStripe("pk_test_stripe_publishable_key");

export function TopUpCreditsButton() {
	return (
		<TopUpCreditsDialog>
			<Button className="flex items-center">
				<Plus className="mr-2 h-4 w-4" />
				Top Up Credits
			</Button>
		</TopUpCreditsDialog>
	);
}

interface TopUpCreditsDialogProps {
	children: React.ReactNode;
}

function TopUpCreditsDialog({ children }: TopUpCreditsDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
	const [amount, setAmount] = useState<number>(50);
	const [loading, setLoading] = useState(false);

	const handleClose = () => {
		setOpen(false);
		setTimeout(() => {
			setStep("amount");
			setLoading(false);
		}, 300);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				{step === "amount" ? (
					<AmountStep
						amount={amount}
						setAmount={setAmount}
						onNext={() => setStep("payment")}
						onCancel={handleClose}
					/>
				) : step === "payment" ? (
					<Elements stripe={stripePromise}>
						<PaymentStep
							amount={amount}
							onBack={() => setStep("amount")}
							onSuccess={() => setStep("success")}
							onCancel={handleClose}
							setLoading={setLoading}
							loading={loading}
						/>
					</Elements>
				) : (
					<SuccessStep onClose={handleClose} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function AmountStep({
	amount,
	setAmount,
	onNext,
	onCancel,
}: {
	amount: number;
	setAmount: (amount: number) => void;
	onNext: () => void;
	onCancel: () => void;
}) {
	const presetAmounts = [10, 25, 50, 100];

	return (
		<>
			<DialogHeader>
				<DialogTitle>Top Up Credits</DialogTitle>
				<DialogDescription>
					Add credits to your organization account.
				</DialogDescription>
			</DialogHeader>
			<div className="space-y-4 py-4">
				<div className="space-y-2">
					<Label htmlFor="amount">Amount (USD)</Label>
					<Input
						id="amount"
						type="number"
						min={5}
						value={amount}
						onChange={(e) => setAmount(Number(e.target.value))}
						required
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					{presetAmounts.map((preset) => (
						<Button
							key={preset}
							type="button"
							variant="outline"
							onClick={() => setAmount(preset)}
						>
							${preset}
						</Button>
					))}
				</div>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" onClick={onNext} disabled={amount < 5}>
					Continue
				</Button>
			</DialogFooter>
		</>
	);
}

function PaymentStep({
	amount,
	onBack,
	onSuccess,
	onCancel,
	loading,
	setLoading,
}: {
	amount: number;
	onBack: () => void;
	onSuccess: () => void;
	onCancel: () => void;
	loading: boolean;
	setLoading: (loading: boolean) => void;
}) {
	const stripe = useStripe();
	const elements = useElements();
	const topUpMutation = useTopUpCredits();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setLoading(true);

		try {
			const { clientSecret } = await topUpMutation.mutateAsync({ amount });

			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: elements.getElement(CardElement)!,
				},
			});

			if (result.error) {
				toast({
					title: "Payment Failed",
					description: result.error.message,
					variant: "destructive",
				});
				setLoading(false);
			} else {
				onSuccess();
			}
		} catch (error) {
			console.error("Payment error:", error);
			toast({
				title: "Payment Failed",
				description: "An error occurred while processing your payment.",
				variant: "destructive",
			});
			setLoading(false);
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>Payment Details</DialogTitle>
				<DialogDescription>
					Enter your card details to add ${amount} credits.
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit} className="space-y-4 py-4">
				<div className="space-y-2">
					<Label htmlFor="card-element">Card Details</Label>
					<div className="border rounded-md p-3">
						<CardElement
							id="card-element"
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
				<DialogFooter className="flex space-x-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={loading}
					>
						Back
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!stripe || loading}>
						{loading ? "Processing..." : `Pay $${amount}`}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}

function SuccessStep({ onClose }: { onClose: () => void }) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>Payment Successful</DialogTitle>
				<DialogDescription>
					Your credits have been added to your account.
				</DialogDescription>
			</DialogHeader>
			<div className="py-4">
				<p>
					Thank you for your purchase. Your credits are now available for use.
				</p>
			</div>
			<DialogFooter>
				<Button onClick={onClose}>Close</Button>
			</DialogFooter>
		</>
	);
}
