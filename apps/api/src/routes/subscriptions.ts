import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
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
						clientSecret: z.string().nullable(),
						subscriptionId: z.string(),
					}),
				},
			},
			description: "Pro subscription created successfully",
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
			message: "Organization not found",
		});
	}

	const organization = userOrganization.organization;

	// Check if organization already has a pro subscription
	if (organization.plan === "pro" && organization.stripeSubscriptionId) {
		throw new HTTPException(400, {
			message: "Organization already has an active pro subscription",
		});
	}

	// Get the default payment method for this organization
	const defaultPaymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			organizationId: organization.id,
			isDefault: true,
		},
	});

	if (!defaultPaymentMethod) {
		throw new HTTPException(400, {
			message:
				"No default payment method found. Please add a payment method first.",
		});
	}

	try {
		const stripeCustomerId = await ensureStripeCustomer(organization.id);

		// Create a subscription using the default payment method
		const subscription = await stripe.subscriptions.create({
			customer: stripeCustomerId,
			items: [
				{
					price: process.env.STRIPE_PRO_PRICE_ID || "price_1234567890",
				},
			],
			default_payment_method: defaultPaymentMethod.stripePaymentMethodId,
			expand: ["latest_invoice.payment_intent"],
			metadata: {
				organizationId: organization.id,
				plan: "pro",
			},
		});

		// Update organization with subscription ID and mark as not cancelled
		await db
			.update(tables.organization)
			.set({
				stripeSubscriptionId: subscription.id,
				subscriptionCancelled: false,
				updatedAt: new Date(),
			})
			.where(eq(tables.organization.id, organization.id));

		const invoice = subscription.latest_invoice as any;
		const paymentIntent = invoice?.payment_intent;

		// If payment requires confirmation, return client secret
		if (paymentIntent && paymentIntent.status === "requires_confirmation") {
			return c.json({
				clientSecret: paymentIntent.client_secret || "",
				subscriptionId: subscription.id,
			});
		}

		// If payment succeeded immediately, return success
		return c.json({
			clientSecret: null,
			subscriptionId: subscription.id,
		});
	} catch (error) {
		console.error("Stripe subscription error:", error);
		throw new HTTPException(500, {
			message: `Failed to create subscription: ${error}`,
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
						cancelAtPeriodEnd: z.boolean().nullable(),
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
	let cancelAtPeriodEnd = null;

	// If there's a subscription, get its status from Stripe
	if (organization.stripeSubscriptionId) {
		try {
			const subscription = await stripe.subscriptions.retrieve(
				organization.stripeSubscriptionId,
			);
			cancelAtPeriodEnd = subscription.cancel_at_period_end;
		} catch (error) {
			console.error("Error retrieving subscription:", error);
		}
	}

	return c.json({
		plan: organization.plan || "free",
		subscriptionId: organization.stripeSubscriptionId,
		planExpiresAt: organization.planExpiresAt?.toISOString() || null,
		cancelAtPeriodEnd,
		subscriptionCancelled: organization.subscriptionCancelled || false,
	});
});
