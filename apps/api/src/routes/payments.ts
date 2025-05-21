import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { z } from "zod";

import type { ServerTypes } from "../vars";

const stripe = new Stripe("sk_test_stripe_secret_key", {
	apiVersion: "2023-10-16",
});

export const payments = new OpenAPIHono<ServerTypes>();

const createPaymentIntent = createRoute({
	method: "post",
	path: "/create-payment-intent",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						amount: z.number().int().min(5),
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
						clientSecret: z.string(),
					}),
				},
			},
			description: "Payment intent created successfully",
		},
	},
});

payments.openapi(createPaymentIntent, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { amount } = c.req.valid("json");

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
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100, // Convert to cents
			currency: "usd",
			metadata: {
				organizationId,
			},
		});

		return c.json({
			clientSecret: paymentIntent.client_secret,
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to create payment intent",
		});
	}
});

const webhookHandler = createRoute({
	method: "post",
	path: "/webhook",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						received: z.boolean(),
					}),
				},
			},
			description: "Webhook received successfully",
		},
	},
});

payments.openapi(webhookHandler, async (c) => {
	const sig = c.req.header("stripe-signature");

	if (!sig) {
		throw new HTTPException(400, {
			message: "Missing stripe-signature header",
		});
	}

	try {
		const body = await c.req.raw.text();
		const webhookSecret = "whsec_test_webhook_secret";

		const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

		switch (event.type) {
			case "payment_intent.succeeded":
				console.log("Payment succeeded:", event.data.object);
				break;
			case "payment_intent.payment_failed":
				console.log("Payment failed:", event.data.object);
				break;
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return c.json({ received: true });
	} catch (error) {
		console.error("Webhook error:", error);
		throw new HTTPException(400, {
			message: `Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`,
		});
	}
});
