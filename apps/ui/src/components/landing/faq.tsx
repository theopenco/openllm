import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon } from "lucide-react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
} from "@/lib/components/accordion";

export function Faq() {
	return (
		<section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
			<div className="container mx-auto px-4 md:px-6">
				{/* Heading */}
				<div className="flex flex-col items-center justify-center space-y-4 text-center">
					<div className="space-y-2">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-white">
							Frequently Asked Questions
						</h2>
						<p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
							Find answers to common questions about our services and offerings.
						</p>
					</div>
				</div>

				{/* Accordion */}
				<div className="mx-auto max-w-3xl mt-8">
					<Accordion
						type="single"
						collapsible
						className="w-full"
						defaultValue="item-1"
					>
						{/* Item 1 */}
						<AccordionItem value="item-1" className="py-2">
							<AccordionPrimitive.Header className="flex">
								<AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-lg font-medium leading-6 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 dark:text-gray-200">
									What makes your service different from OpenRouter?
									<PlusIcon
										size={18}
										className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
										aria-hidden="true"
									/>
								</AccordionPrimitive.Trigger>
							</AccordionPrimitive.Header>
							<AccordionContent className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up text-gray-500 dark:text-gray-400 pb-2">
								<p>Unlike OpenRouter, we offer:</p>
								<ul className="list-disc pl-6 mt-2 space-y-1">
									<li>
										Full self-hosting capabilities with an MIT license, giving
										you complete control over your infrastructure
									</li>
									<li>
										Enhanced analytics with deeper insights into your model
										usage and performance
									</li>
									<li>
										No fees when using your own provider keys, maximizing cost
										efficiency
									</li>
									<li>
										Greater flexibility and customization options for enterprise
										deployments
									</li>
								</ul>
							</AccordionContent>
						</AccordionItem>

						{/* Item 2 */}
						<AccordionItem value="item-2" className="py-2">
							<AccordionPrimitive.Header className="flex">
								<AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-lg font-medium leading-6 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 dark:text-gray-200">
									What models do you support?
									<PlusIcon
										size={18}
										className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
										aria-hidden="true"
									/>
								</AccordionPrimitive.Trigger>
							</AccordionPrimitive.Header>
							<AccordionContent className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up text-gray-500 dark:text-gray-400 pb-2">
								We support a comprehensive range of AI models across various
								providers. For a complete and up-to-date list of all supported
								models, please visit our public models page. We regularly update
								our supported models to ensure you have access to the latest and
								most powerful AI capabilities.
							</AccordionContent>
						</AccordionItem>

						{/* Item 3 */}
						<AccordionItem value="item-3" className="py-2">
							<AccordionPrimitive.Header className="flex">
								<AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-lg font-medium leading-6 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 dark:text-gray-200">
									What is your uptime guarantee?
									<PlusIcon
										size={18}
										className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
										aria-hidden="true"
									/>
								</AccordionPrimitive.Trigger>
							</AccordionPrimitive.Header>
							<AccordionContent className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up text-gray-500 dark:text-gray-400 pb-2">
								We're committed to providing reliable service with high
								availability. We're currently implementing a public status page
								where you can monitor our system performance, uptime metrics,
								and any ongoing incidents in real-time. This transparency
								ensures you're always informed about our service status.
							</AccordionContent>
						</AccordionItem>

						{/* Item 4 */}
						<AccordionItem value="item-4" className="py-2">
							<AccordionPrimitive.Header className="flex">
								<AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-lg font-medium leading-6 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 dark:text-gray-200">
									How much do you charge for your services?
									<PlusIcon
										size={18}
										className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
										aria-hidden="true"
									/>
								</AccordionPrimitive.Trigger>
							</AccordionPrimitive.Header>
							<AccordionContent className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up text-gray-500 dark:text-gray-400 pb-2">
								<p>
									Our pricing structure is designed to be flexible and
									cost-effective:
								</p>
								<ul className="list-disc pl-6 mt-2 space-y-1">
									<li>
										<strong>Free tier:</strong> No fees when providing your own
										provider API keys
									</li>
									<li>
										<strong>Self-hosted option:</strong> Fully self-host our
										solution for free with our MIT-licensed software
									</li>
									<li>
										<strong>Premium features:</strong> Access to advanced
										analytics and deeper insights
									</li>
								</ul>
								<p className="mt-2">
									We're currently finalizing our complete pricing structure for
									managed services and enterprise solutions. Contact us for more
									details on custom pricing options.
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</section>
	);
}
