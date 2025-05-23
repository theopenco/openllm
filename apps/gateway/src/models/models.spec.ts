import { describe, expect, test } from "vitest";

import { app } from "../index";

describe("Models API", () => {
	test("GET /v1/models should return a list of models", async () => {
		const res = await app.request("/v1/models");

		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(Array.isArray(json.data)).toBe(true);
		expect(json.data.length).toBeGreaterThan(0);

		// Check the structure of the first model
		const firstModel = json.data[0];
		expect(firstModel).toHaveProperty("id");
		expect(firstModel).toHaveProperty("name");
		expect(firstModel).toHaveProperty("created");
		expect(firstModel).toHaveProperty("architecture");
		expect(firstModel.architecture).toHaveProperty("input_modalities");
		expect(firstModel.architecture).toHaveProperty("output_modalities");
		expect(firstModel).toHaveProperty("top_provider");
		expect(firstModel).toHaveProperty("pricing");
		expect(firstModel.pricing).toHaveProperty("prompt");
		expect(firstModel.pricing).toHaveProperty("completion");
	});
});
