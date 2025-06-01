import { PostHog } from "posthog-node";

export const posthog = new PostHog(process.env.VITE_POSTHOG_KEY || "key", {
	host: process.env.VITE_POSTHOG_HOST || "key",
});
