import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "@/hooks/useUser";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/lib/components/form";
import { Input } from "@/lib/components/input";
import { toast } from "@/lib/components/use-toast";

const formSchema = z.object({
	name: z.string().min(2, { message: "Name is required" }),
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters" }),
});

export const Route = createFileRoute("/signup")({
	component: RouteComponent,
});

function RouteComponent() {
	const posthog = usePostHog();
	const [isLoading, setIsLoading] = useState(false);
	useUser({ redirectTo: "/dashboard", redirectWhen: "authenticated" });

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);

		const { error } = await signUp.email(
			{
				name: values.name,
				email: values.email,
				password: values.password,
				callbackURL: "/onboarding",
			},
			{
				onSuccess: () => {
					posthog.identify(values.email);
					toast({ title: "Account created", description: "Welcome!" });
					window.location.href = "/onboarding";
				},
				onError: (ctx) => {
					toast({
						title: ctx.error.message || "Failed to sign up",
						variant: "destructive",
						className: "text-white",
					});
				},
			},
		);

		if (error) {
			toast({
				title: error.message || "Failed to sign up",
				variant: "destructive",
				className: "text-white",
			});
		}

		setIsLoading(false);
	}

	return (
		<div className="max-w-[64rm] mx-auto flex h-screen w-screen flex-col items-center justify-center">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Create an account
					</h1>
					<p className="text-sm text-muted-foreground">
						Enter your email below to create your account
					</p>
				</div>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="name@example.com"
											type="email"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input placeholder="••••••••" type="password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Create account"
							)}
						</Button>
					</form>
				</Form>
				<p className="px-8 text-center text-sm text-muted-foreground">
					<Link
						to="/login"
						className="hover:text-brand underline underline-offset-4"
					>
						Already have an account? Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
