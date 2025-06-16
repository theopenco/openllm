import anthropicLogo from "@/assets/models/anthropic.svg?react";
import CloudRiftLogo from "@/assets/models/cloudrift.svg?react";
import GoogleStudioAiLogo from "@/assets/models/google-studio-ai.svg?react";
import GoogleVertexLogo from "@/assets/models/google-vertex-ai.svg?react";
import InferenceLogo from "@/assets/models/inference-net.svg?react";
import KlusterLogo from "@/assets/models/kluster-ai.svg?react";
import LLMGatewayLogo from "@/assets/models/llmgateway.svg?react";
import MistralLogo from "@/assets/models/mistral.svg?react";
import OpenAiLogo from "@/assets/models/openai.svg?react";
import TogetherAiLogo from "@/assets/models/together-ai.svg?react";

import type { ProviderId } from "@llmgateway/models";
import type React from "react";

export const providerLogoComponents: Partial<
	Record<ProviderId, React.FC<React.SVGProps<SVGSVGElement>> | null>
> = {
	llmgateway: LLMGatewayLogo,
	openai: OpenAiLogo,
	anthropic: anthropicLogo,
	"google-vertex": GoogleVertexLogo,
	"inference.net": InferenceLogo,
	"kluster.ai": KlusterLogo,
	"together.ai": TogetherAiLogo,
	"google-ai-studio": GoogleStudioAiLogo,
	cloudrift: CloudRiftLogo,
	mistral: MistralLogo,
};
