import { loadStripe } from "@stripe/stripe-js";

export function loadStripeNow() {
	return loadStripe(
		process.env.NODE_ENV === "development"
			? "pk_test_51RRXM1CYKGHizcWTfXxFSEzN8gsUQkg2efi2FN5KO2M2hxdV9QPCjeZMPaZQHSAatxpK9wDcSeilyYU14gz2qA2p00R4q5xU1R"
			: "pk_live_51RRXLsEAkKxa3kRayCPr9oW8dUp7mIzwev1FVpM3jpKU3StLaaiKvXCEPkewabL5hRip4IXLzFlFTLC4RpFWRknN00lX2vgZHP",
	);
}
