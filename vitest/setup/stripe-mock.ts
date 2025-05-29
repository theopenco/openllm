import { vi } from "vitest";

vi.mock("@stripe/react-stripe-js", () => {
	return {
		Elements: ({ children }) => children,
		CardElement: () => null,
		useStripe: () => ({
			confirmCardPayment: vi
				.fn()
				.mockResolvedValue({ paymentIntent: { status: "succeeded" } }),
			confirmSetupIntent: vi
				.fn()
				.mockResolvedValue({ setupIntent: { status: "succeeded" } }),
		}),
		useElements: () => ({
			getElement: () => ({}),
		}),
	};
});

vi.mock("@stripe/stripe-js", () => {
	return {
		loadStripe: () =>
			Promise.resolve({
				elements: () => ({}),
				confirmCardPayment: vi
					.fn()
					.mockResolvedValue({ paymentIntent: { status: "succeeded" } }),
				confirmSetupIntent: vi
					.fn()
					.mockResolvedValue({ setupIntent: { status: "succeeded" } }),
			}),
	};
});
