import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@llmgateway/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { stripe } from "./payments";
import { ensureStripeCustomer } from "../stripe";

import type { ServerTypes } from "../vars";

export const subscriptions = new OpenAPIHono<ServerTypes>();

const createProSubscription = createRoute({
	method: "post",
	path: "/create-pro-subscription",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						checkoutUrl: z.string(),
					}),
				},
			},
			description: "Stripe Checkout session created successfully",
		},
	},
});

subscriptions.openapi(createProSubscription, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization or user not found",
		});
	}

	const organization = userOrganization.organization;

	// Check if organization already has a pro subscription
	if (organization.plan === "pro" && organization.stripeSubscriptionId) {
		throw new HTTPException(400, {
			message: "Organization already has an active pro subscription",
		});
	}

	try {
		const stripeCustomerId = await ensureStripeCustomer(organization.id);

		// Check if STRIPE_PRO_PRICE_ID is set
		if (!process.env.STRIPE_PRO_PRICE_ID) {
			throw new HTTPException(500, {
				message: "STRIPE_PRO_PRICE_ID environment variable is not set",
			});
		}

		// Create Stripe Checkout session
		const session = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			mode: "subscription",
			line_items: [
				{
					price: process.env.STRIPE_PRO_PRICE_ID,
					quantity: 1,
				},
			],
			success_url: `${process.env.UI_URL || "http://localhost:3002"}/dashboard/settings/billing?success=true`,
			cancel_url: `${process.env.UI_URL || "http://localhost:3002"}/dashboard/settings/billing?canceled=true`,
			metadata: {
				organizationId: organization.id,
				plan: "pro",
			},
			subscription_data: {
				metadata: {
					organizationId: organization.id,
					plan: "pro",
				},
			},
		});

		if (!session.url) {
			throw new HTTPException(500, {
				message: "Failed to generate checkout URL",
			});
		}

		return c.json({
			checkoutUrl: session.url,
		});
	} catch (error) {
		console.error("Stripe checkout session error:", error);
		throw new HTTPException(500, {
			message: `Failed to create checkout session: ${error}`,
		});
	}
});

const cancelProSubscription = createRoute({
	method: "post",
	path: "/cancel-pro-subscription",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Pro subscription canceled successfully",
		},
	},
});

subscriptions.openapi(cancelProSubscription, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organization = userOrganization.organization;

	if (!organization.stripeSubscriptionId) {
		throw new HTTPException(400, {
			message: "No active subscription found",
		});
	}

	try {
		// Cancel the subscription at the end of the current period
		await stripe.subscriptions.update(organization.stripeSubscriptionId, {
			cancel_at_period_end: true,
		});

		// let the webhook handler the rest to unify the logic
		await new Promise((resolve) => {
			setTimeout(resolve, 5000);
		});

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Stripe subscription cancellation error:", error);
		throw new HTTPException(500, {
			message: "Failed to cancel subscription",
		});
	}
});

const resumeProSubscription = createRoute({
	method: "post",
	path: "/resume-pro-subscription",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Pro subscription resumed successfully",
		},
	},
});

subscriptions.openapi(resumeProSubscription, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organization = userOrganization.organization;

	if (!organization.stripeSubscriptionId) {
		throw new HTTPException(400, {
			message: "No active subscription found",
		});
	}

	try {
		// Check if subscription is actually cancelled
		const subscription = await stripe.subscriptions.retrieve(
			organization.stripeSubscriptionId,
		);

		if (!subscription.cancel_at_period_end) {
			throw new HTTPException(400, {
				message: "Subscription is not cancelled",
			});
		}

		// Resume the subscription by setting cancel_at_period_end to false
		await stripe.subscriptions.update(organization.stripeSubscriptionId, {
			cancel_at_period_end: false,
		});

		// let the webhook handler the rest to unify the logic
		await new Promise((resolve) => {
			setTimeout(resolve, 5000);
		});

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Stripe subscription resume error:", error);
		throw new HTTPException(500, {
			message: "Failed to resume subscription",
		});
	}
});

const getSubscriptionStatus = createRoute({
	method: "get",
	path: "/status",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						plan: z.enum(["free", "pro"]),
						subscriptionId: z.string().nullable(),
						planExpiresAt: z.string().nullable(),
						subscriptionCancelled: z.boolean(),
					}),
				},
			},
			description: "Subscription status retrieved successfully",
		},
	},
});

subscriptions.openapi(getSubscriptionStatus, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organization = userOrganization.organization;

	return c.json({
		plan: organization.plan || "free",
		subscriptionId: organization.stripeSubscriptionId,
		planExpiresAt: organization.planExpiresAt?.toISOString() || null,
		subscriptionCancelled: organization.subscriptionCancelled || false,
	});
});
