"use client";

import { models } from "@openllm/models";

import { Badge } from "@/lib/components/badge";
import { Card } from "@/lib/components/card";

import type { ModelDefinition } from "@openllm/models";

export function ModelsList() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{(models as readonly ModelDefinition[]).map((model) => (
				<Card key={model.model} className="p-4">
					<div className="text-lg font-semibold">{model.model}</div>
					<div className="text-sm text-muted-foreground mb-2">Providers:</div>
					<div className="flex flex-wrap gap-2 mb-2">
						{model.providers.map((provider) => (
							<Badge key={provider}>{provider}</Badge>
						))}
					</div>
					<div className="text-sm">
						{model.inputPrice !== undefined && (
							<div>Input: ${model.inputPrice.toFixed(8)} / token</div>
						)}
						{model.outputPrice !== undefined && (
							<div>Output: ${model.outputPrice.toFixed(8)} / token</div>
						)}
						{model.imageInputPrice !== undefined && (
							<div>Image: ${model.imageInputPrice.toFixed(5)} / input</div>
						)}
					</div>
				</Card>
			))}
		</div>
	);
}
