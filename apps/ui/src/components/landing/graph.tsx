import { MonitorSmartphone, HelpCircle } from "lucide-react";
import React, { forwardRef, useId, useRef } from "react";

import { AnimatedBeam } from "./animated-beam";
import AnthropicLogo from "@/assets/models/anthropic.svg?react";
import GoogleVertexLogo from "@/assets/models/google-vertex-ai.svg?react";
import InferenceLogo from "@/assets/models/inference-net.svg?react";
import KlusterLogo from "@/assets/models/kluster-ai.svg?react";
import OpenAiLogo from "@/assets/models/openai.svg?react";
import {
	Tooltip,
	TooltipProvider,
	TooltipTrigger,
	TooltipContent,
} from "@/lib/components/tooltip";
import Logo from "@/lib/icons/Logo";
import { cn } from "@/lib/utils";

const Circle = forwardRef<
	HTMLDivElement,
	{ className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"group relative z-10 flex size-14 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-black dark:border-neutral-800",
				className,
			)}
		>
			{children}
		</div>
	);
});

Circle.displayName = "Circle";

export function Graph() {
	const containerRef = useRef<HTMLDivElement>(null);
	const leftRef = useRef<HTMLDivElement>(null);
	const centerRef = useRef<HTMLDivElement>(null);
	const rightRefs = [
		useRef<HTMLDivElement>(null),
		useRef<HTMLDivElement>(null),
		useRef<HTMLDivElement>(null),
		useRef<HTMLDivElement>(null),
		useRef<HTMLDivElement>(null),
		useRef<HTMLDivElement>(null),
	];

	const logos = [
		<OpenAiLogo key={useId()} />,
		<AnthropicLogo key={useId()} />,
		<GoogleVertexLogo key={useId()} />,
		<InferenceLogo key={useId()} />,
		<KlusterLogo key={useId()} />,
	];

	return (
		<div className="w-full bg-background py-16 px-4 text-center dark:text-white">
			<h2 className="text-3xl font-semibold">Model Orchestration</h2>
			<p className="mt-2 text-muted-foreground dark:text-neutral-400 max-w-xl mx-auto">
				We dynamically route requests from devices to the optimal AI
				model—OpenAI, Anthropic, Google, and more.
			</p>

			<div
				className="relative mt-12 flex h-[500px] max-w-4xl mx-auto items-center justify-center p-10"
				ref={containerRef}
			>
				<div className="absolute left-10 top-1/2 -translate-y-1/2 z-10">
					<Circle ref={leftRef}>
						<MonitorSmartphone className="text-black dark:text-white" />
					</Circle>
				</div>

				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
					<Circle ref={centerRef}>
						<Logo />
					</Circle>
				</div>

				<div className="absolute right-10 top-1/2 flex -translate-y-1/2 flex-col items-center justify-center gap-6 z-10">
					{logos.map((Logo, index) => (
						<Circle key={index} ref={rightRefs[index]}>
							{Logo}
						</Circle>
					))}

					<div className="relative group">
						<TooltipProvider delayDuration={100}>
							<Tooltip>
								<TooltipTrigger>
									<Circle ref={rightRefs[5]}>
										<HelpCircle className="text-muted-foreground dark:text-neutral-400" />
									</Circle>
								</TooltipTrigger>
								<TooltipContent>
									Could be your model?{" "}
									<a
										href="mailto:contact@llmgateway.io"
										className="text-blue-500 underline"
										target="_blank"
									>
										Get in touch
									</a>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				<AnimatedBeam
					containerRef={containerRef}
					fromRef={leftRef}
					toRef={centerRef}
				/>
				{rightRefs.map((ref, i) => (
					<AnimatedBeam
						key={i}
						containerRef={containerRef}
						fromRef={centerRef}
						toRef={ref}
						curvature={(i - 2.5) * 20}
					/>
				))}
			</div>
		</div>
	);
}
