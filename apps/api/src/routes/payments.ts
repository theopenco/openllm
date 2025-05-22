import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { z } from "zod";

import type { ServerTypes } from "../vars";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
	apiVersion: "2025-04-30.basil",
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
			clientSecret: paymentIntent.client_secret || "",
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

		console.log(event);

		switch (event.type) {
			case "payment_intent.succeeded":
				console.log("Payment succeeded:", event.data.object);
				break;
			case "payment_intent.payment_failed":
				console.log("Payment failed:", event.data.object);
				break;
			case "setup_intent.succeeded":
				await handleSetupIntentSucceeded(event.data.object);
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

const createSetupIntent = createRoute({
	method: "post",
	path: "/create-setup-intent",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						clientSecret: z.string(),
					}),
				},
			},
			description: "Setup intent created successfully",
		},
	},
});

payments.openapi(createSetupIntent, async (c) => {
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

	const organizationId = userOrganization.organization.id;

	try {
		const setupIntent = await stripe.setupIntents.create({
			usage: "off_session",
			metadata: {
				organizationId,
			},
		});

		return c.json({
			clientSecret: setupIntent.client_secret || "",
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to create setup intent",
		});
	}
});

const getPaymentMethods = createRoute({
	method: "get",
	path: "/payment-methods",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						paymentMethods: z.array(
							z.object({
								id: z.string(),
								stripePaymentMethodId: z.string(),
								type: z.string(),
								isDefault: z.boolean(),
								cardBrand: z.string().optional(),
								cardLast4: z.string().optional(),
								expiryMonth: z.number().optional(),
								expiryYear: z.number().optional(),
							}),
						),
					}),
				},
			},
			description: "Payment methods retrieved successfully",
		},
	},
});

payments.openapi(getPaymentMethods, async (c) => {
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

	const organizationId = userOrganization.organization.id;

	try {
		const paymentMethods = await db.query.paymentMethod.findMany({
			where: {
				organizationId,
			},
		});

		const enhancedPaymentMethods = await Promise.all(
			paymentMethods.map(async (pm) => {
				const stripePaymentMethod = await stripe.paymentMethods.retrieve(
					pm.stripePaymentMethodId,
				);

				let cardDetails = {};
				if (stripePaymentMethod.type === "card" && stripePaymentMethod.card) {
					cardDetails = {
						cardBrand: stripePaymentMethod.card.brand,
						cardLast4: stripePaymentMethod.card.last4,
						expiryMonth: stripePaymentMethod.card.exp_month,
						expiryYear: stripePaymentMethod.card.exp_year,
					};
				}

				return {
					...pm,
					...cardDetails,
				};
			}),
		);

		return c.json({
			paymentMethods: enhancedPaymentMethods,
		});
	} catch (error) {
		console.error("Error fetching payment methods:", error);
		throw new HTTPException(500, {
			message: "Failed to fetch payment methods",
		});
	}
});

const setDefaultPaymentMethod = createRoute({
	method: "post",
	path: "/payment-methods/default",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						paymentMethodId: z.string(),
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
						success: z.boolean(),
					}),
				},
			},
			description: "Default payment method set successfully",
		},
	},
});

payments.openapi(setDefaultPaymentMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { paymentMethodId } = c.req.valid("json");

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

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id: paymentMethodId,
			organizationId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
		});
	}

	try {
		await db
			.update(tables.paymentMethod)
			.set({
				isDefault: false,
				updatedAt: new Date(),
			})
			.where(eq(tables.paymentMethod.organizationId, organizationId));

		await db
			.update(tables.paymentMethod)
			.set({
				isDefault: true,
				updatedAt: new Date(),
			})
			.where(eq(tables.paymentMethod.id, paymentMethodId));

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Error setting default payment method:", error);
		throw new HTTPException(500, {
			message: "Failed to set default payment method",
		});
	}
});

const deletePaymentMethod = createRoute({
	method: "delete",
	path: "/payment-methods/:id",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Payment method deleted successfully",
		},
	},
});

payments.openapi(deletePaymentMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

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

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id,
			organizationId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
		});
	}

	try {
		await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

		await db
			.delete(tables.paymentMethod)
			.where(eq(tables.paymentMethod.id, id));

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Error deleting payment method:", error);
		throw new HTTPException(500, {
			message: "Failed to delete payment method",
		});
	}
});

const topUpWithSavedMethod = createRoute({
	method: "post",
	path: "/top-up-with-saved-method",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						amount: z.number().int().min(5),
						paymentMethodId: z.string(),
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
						success: z.boolean(),
					}),
				},
			},
			description: "Payment processed successfully",
		},
	},
});

payments.openapi(topUpWithSavedMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { amount, paymentMethodId } = c.req.valid("json");

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id: paymentMethodId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
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

	if (
		!userOrganization ||
		!userOrganization.organization ||
		userOrganization.organization.id !== paymentMethod.organizationId
	) {
		throw new HTTPException(403, {
			message: "Unauthorized access to payment method",
		});
	}

	try {
		const stripeCustomerId = userOrganization.organization.stripeCustomerId;

		if (!stripeCustomerId) {
			throw new HTTPException(400, {
				message: "No Stripe customer ID found for this organization",
			});
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100, // Convert to cents
			currency: "usd",
			payment_method: paymentMethod.stripePaymentMethodId,
			customer: stripeCustomerId,
			confirm: true,
			off_session: true,
			metadata: {
				organizationId: userOrganization.organization.id,
			},
		});

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to process payment",
		});
	}
});

async function handleSetupIntentSucceeded(setupIntent: any) {
	const { metadata, payment_method } = setupIntent;
	const { organizationId } = metadata;

	if (!organizationId || !payment_method) {
		console.error("Missing organizationId or payment_method in setupIntent");
		return;
	}

	const organization = await db.query.organization.findFirst({
		where: {
			id: organizationId,
		},
	});

	if (!organization) {
		console.error(`Organization not found: ${organizationId}`);
		return;
	}

	let stripeCustomerId = organization.stripeCustomerId;
	if (!stripeCustomerId) {
		const customer = await stripe.customers.create({
			metadata: {
				organizationId,
			},
		});
		stripeCustomerId = customer.id;

		await db
			.update(tables.organization)
			.set({
				stripeCustomerId,
				updatedAt: new Date(),
			})
			.where(eq(tables.organization.id, organizationId));
	}

	await stripe.paymentMethods.attach(payment_method, {
		customer: stripeCustomerId,
	});

	const paymentMethod = await stripe.paymentMethods.retrieve(payment_method);

	const existingPaymentMethods = await db.query.paymentMethod.findMany({
		where: {
			organizationId,
		},
	});

	const isDefault = existingPaymentMethods.length === 0;

	await db.insert(tables.paymentMethod).values({
		stripePaymentMethodId: payment_method,
		organizationId,
		type: paymentMethod.type,
		isDefault,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}
