import {
	CardElement,
	Elements,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
	useCreateSetupIntent,
	usePaymentMethods,
} from "./hooks/usePaymentMethods";
import { useTopUpCredits } from "./hooks/useTopUpCredits";
import { useTopUpCreditsWithSavedMethod } from "./hooks/useTopUpCreditsWithSavedMethod";
import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
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

const stripePromise = loadStripe(
	process.env.VITE_STRIPE_PUBLIC_KEY ||
		"pk_test_51RRXM1CYKGHizcWTfXxFSEzN8gsUQkg2efi2FN5KO2M2hxdV9QPCjeZMPaZQHSAatxpK9wDcSeilyYU14gz2qA2p00R4q5xU1R",
);

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
	const [step, setStep] = useState<
		"amount" | "payment" | "select-payment" | "confirm-payment" | "success"
	>("amount");
	const [amount, setAmount] = useState<number>(50);
	const [loading, setLoading] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
		string | null
	>(null);

	const { data: paymentMethodsData } = usePaymentMethods();
	const hasPaymentMethods =
		paymentMethodsData?.paymentMethods &&
		paymentMethodsData.paymentMethods.length > 0;
	const defaultPaymentMethod = paymentMethodsData?.paymentMethods.find(
		(pm) => pm.isDefault,
	);

	useEffect(() => {
		if (defaultPaymentMethod) {
			setSelectedPaymentMethod(defaultPaymentMethod.id);
		}
	}, [defaultPaymentMethod]);

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
						onNext={() => {
							if (hasPaymentMethods) {
								setStep("select-payment");
							} else {
								setStep("payment");
							}
						}}
						onCancel={handleClose}
					/>
				) : step === "select-payment" ? (
					<SelectPaymentStep
						amount={amount}
						paymentMethods={paymentMethodsData?.paymentMethods || []}
						selectedPaymentMethod={selectedPaymentMethod}
						setSelectedPaymentMethod={setSelectedPaymentMethod}
						onUseSelected={() => setStep("confirm-payment")}
						onAddNew={() => setStep("payment")}
						onBack={() => setStep("amount")}
						onCancel={handleClose}
					/>
				) : step === "confirm-payment" ? (
					<ConfirmPaymentStep
						amount={amount}
						paymentMethodId={selectedPaymentMethod!}
						onSuccess={() => setStep("success")}
						onBack={() => setStep("select-payment")}
						onCancel={handleClose}
						setLoading={setLoading}
						loading={loading}
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
	const setupIntentMutation = useCreateSetupIntent();
	const [saveCard, setSaveCard] = useState(true);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setLoading(true);

		try {
			if (saveCard) {
				const { clientSecret: setupSecret } =
					await setupIntentMutation.mutateAsync();

				const setupResult = await stripe.confirmCardSetup(setupSecret, {
					payment_method: {
						card: elements.getElement(CardElement)!,
					},
				});

				if (setupResult.error) {
					toast({
						title: "Error Saving Card",
						description: setupResult.error.message,
						variant: "destructive",
					});
					setLoading(false);
					return;
				}
			}

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
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="save-card"
							checked={saveCard}
							onCheckedChange={(checked) => setSaveCard(checked as boolean)}
						/>
						<Label htmlFor="save-card">
							Save this card for future payments
						</Label>
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

function SelectPaymentStep({
	amount,
	paymentMethods,
	selectedPaymentMethod,
	setSelectedPaymentMethod,
	onUseSelected,
	onAddNew,
	onBack,
	onCancel,
}: {
	amount: number;
	paymentMethods: any[];
	selectedPaymentMethod: string | null;
	setSelectedPaymentMethod: (id: string) => void;
	onUseSelected: () => void;
	onAddNew: () => void;
	onBack: () => void;
	onCancel: () => void;
}) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>Select Payment Method</DialogTitle>
				<DialogDescription>
					Choose a payment method to add ${amount} credits.
				</DialogDescription>
			</DialogHeader>
			<div className="space-y-4 py-4">
				<div className="space-y-2">
					{paymentMethods.map((method) => (
						<div
							key={method.id}
							className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
								selectedPaymentMethod === method.id ? "border-primary" : ""
							}`}
							onClick={() => setSelectedPaymentMethod(method.id)}
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
						</div>
					))}
					<Button
						variant="outline"
						className="w-full flex items-center justify-center gap-2"
						onClick={onAddNew}
					>
						<Plus className="h-4 w-4" />
						Add New Payment Method
					</Button>
				</div>
			</div>
			<DialogFooter className="flex space-x-2 justify-end">
				<Button type="button" variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					onClick={onUseSelected}
					disabled={!selectedPaymentMethod}
				>
					Continue
				</Button>
			</DialogFooter>
		</>
	);
}

function ConfirmPaymentStep({
	amount,
	paymentMethodId,
	onSuccess,
	onBack,
	onCancel,
	loading,
	setLoading,
}: {
	amount: number;
	paymentMethodId: string;
	onSuccess: () => void;
	onBack: () => void;
	onCancel: () => void;
	loading: boolean;
	setLoading: (loading: boolean) => void;
}) {
	const topUpMutation = useTopUpCreditsWithSavedMethod();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setLoading(true);

		try {
			await topUpMutation.mutateAsync({ amount, paymentMethodId });
			onSuccess();
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
				<DialogTitle>Confirm Payment</DialogTitle>
				<DialogDescription>
					Confirm your payment of ${amount} to add credits.
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit} className="space-y-4 py-4">
				<div className="border rounded-lg p-4">
					<p className="font-medium">Payment Summary</p>
					<p className="text-sm text-muted-foreground mt-2">
						Amount: ${amount}
					</p>
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
					<Button type="submit" disabled={loading}>
						{loading ? "Processing..." : `Pay $${amount}`}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}
