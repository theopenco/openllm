import { PostHog } from "posthog-node";

export const posthog = new PostHog(process.env.POSTHOG_KEY || "key", {
	host: process.env.POSTHOG_HOST || "key",
});
