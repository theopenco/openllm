import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { z } from "zod";

import { ensureStripeCustomer } from "../stripe";

import type { ServerTypes } from "../vars";

export const stripe = new Stripe(
	process.env.STRIPE_SECRET_KEY || "sk_test_123",
	{
		apiVersion: "2025-04-30.basil",
	},
);

const subscriptions = new OpenAPIHono<ServerTypes>();

const createSubscription = createRoute({
	method: "post",
	path: "/create",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						plan: z.enum(["pro"]),
						billing: z.enum(["monthly", "annual"]),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						url: z.string(),
					}),
				},
			},
			description: "Checkout session created successfully",
		},
	},
});

subscriptions.openapi(createSubscription, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { plan, billing } = c.req.valid("json");

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

	const organizationId = userOrganization.organization.id;

	try {
		console.log(
			`Creating subscription for org ${organizationId}, plan: ${plan}, billing: ${billing}`,
		);

		const stripeCustomerId = await ensureStripeCustomer(organizationId);
		console.log(`Stripe customer ID: ${stripeCustomerId}`);

		// Define price IDs for different plans
		const priceIds = {
			pro: {
				monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
				annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_annual",
			},
		};

		const priceId = priceIds[plan][billing];
		console.log(`Using price ID: ${priceId}`);

		// For development/testing, we'll create a one-time payment instead of subscription for now
		const isDev =
			process.env.NODE_ENV === "development" ||
			!process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

		if (isDev) {
			console.log(
				"Development mode - creating one-time payment instead of subscription",
			);
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				mode: "payment",
				customer: stripeCustomerId,
				line_items: [
					{
						price_data: {
							currency: "usd",
							product_data: {
								name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billing.charAt(0).toUpperCase() + billing.slice(1)}`,
								description: `Upgrade to ${plan} plan (${billing} billing)`,
							},
							unit_amount: billing === "annual" ? 50000 : 5000, // $500 or $50 in cents
						},
						quantity: 1,
					},
				],
				success_url: `${process.env.FRONTEND_URL || "http://localhost:3002"}/dashboard?success=true`,
				cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3002"}/pricing?canceled=true`,
				metadata: {
					organizationId,
					plan,
					billing,
					type: "subscription_dev",
				},
			});

			return c.json({
				url: session.url || "",
			});
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			mode: "subscription",
			customer: stripeCustomerId,
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			success_url: `${process.env.FRONTEND_URL || "http://localhost:3002"}/dashboard?success=true`,
			cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3002"}/pricing?canceled=true`,
			metadata: {
				organizationId,
				plan,
				billing,
			},
		});

		console.log(`Created session: ${session.id}`);
		return c.json({
			url: session.url || "",
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: `Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`,
		});
	}
});

const webhookHandler = createRoute({
	method: "post",
	path: "/webhook",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						received: z.boolean(),
					}),
				},
			},
			description: "Webhook processed successfully",
		},
	},
});

subscriptions.openapi(webhookHandler, async (c) => {
	const sig = c.req.header("stripe-signature");
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!sig || !endpointSecret) {
		throw new HTTPException(400, {
			message: "Missing signature or endpoint secret",
		});
	}

	let event: Stripe.Event;

	try {
		const body = await c.req.text();
		event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
	} catch (err) {
		console.error("Webhook signature verification failed:", err);
		throw new HTTPException(400, {
			message: "Invalid signature",
		});
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const organizationId = session.metadata?.organizationId;
				const plan = session.metadata?.plan;
				const type = session.metadata?.type;

				console.log(
					`Checkout session completed for org ${organizationId}, plan: ${plan}, type: ${type}`,
				);

				if (organizationId && plan) {
					if (type === "subscription_dev") {
						// For development payments, just upgrade the plan
						await db
							.update(tables.organization)
							.set({
								plan: plan as "free" | "pro" | "enterprise",
								subscriptionStatus: "active",
								updatedAt: new Date(),
							})
							.where(eq(tables.organization.id, organizationId));
					} else {
						// For real subscriptions
						await db
							.update(tables.organization)
							.set({
								plan: plan as "free" | "pro" | "enterprise",
								stripeSubscriptionId: session.subscription as string,
								subscriptionStatus: "active",
								updatedAt: new Date(),
							})
							.where(eq(tables.organization.id, organizationId));
					}
				}
				break;
			}
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;

				// Find organization by stripe customer ID
				const organization = await db.query.organization.findFirst({
					where: {
						stripeCustomerId: subscription.customer as string,
					},
				});

				if (organization) {
					await db
						.update(tables.organization)
						.set({
							subscriptionStatus: subscription.status as any,
							updatedAt: new Date(),
						})
						.where(eq(tables.organization.id, organization.id));
				}
				break;
			}
			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;

				// Find organization by stripe customer ID
				const organization = await db.query.organization.findFirst({
					where: {
						stripeCustomerId: subscription.customer as string,
					},
				});

				if (organization) {
					await db
						.update(tables.organization)
						.set({
							plan: "free",
							subscriptionStatus: "canceled",
							stripeSubscriptionId: null,
							updatedAt: new Date(),
						})
						.where(eq(tables.organization.id, organization.id));
				}
				break;
			}
		}
	} catch (error) {
		console.error("Error processing webhook:", error);
		throw new HTTPException(500, {
			message: "Error processing webhook",
		});
	}

	return c.json({ received: true });
});

const cancelSubscription = createRoute({
	method: "post",
	path: "/cancel",
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
			description: "Subscription canceled successfully",
		},
	},
});

subscriptions.openapi(cancelSubscription, async (c) => {
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
		await stripe.subscriptions.cancel(organization.stripeSubscriptionId);

		await db
			.update(tables.organization)
			.set({
				subscriptionStatus: "canceled",
				updatedAt: new Date(),
			})
			.where(eq(tables.organization.id, organization.id));

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Error canceling subscription:", error);
		throw new HTTPException(500, {
			message: "Failed to cancel subscription",
		});
	}
});

export default subscriptions;
