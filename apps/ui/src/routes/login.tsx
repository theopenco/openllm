import { createFileRoute } from "@tanstack/react-router";

import { signIn } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email");
		const password = formData.get("password");

		if (!email || !password) {
			toast({
				title: "Please enter an email and password.",
			});
			return;
		}

		const { error } = await signIn.email(
			{
				email: email as string,
				password: password as string,
				// callbackURL: "/dashboard",
			},
			{
				onSuccess: () => {
					window.location.href = "/dashboard";
				},
				onError: (ctx) => {
					toast({
						title: ctx.error.message || "An unknown error occurred",
					});
				},
			},
		);
		if (error) {
			toast({
				title: error.message || "An unknown error occurred",
			});
		}
	};

	return (
		<div>
			<h1>Login</h1>
			<p>Please login to continue.</p>

			<form className="flex flex-col items-center" onSubmit={onSubmit}>
				<input
					type="text"
					name="email"
					placeholder="Email"
					className="rounded-md border-2 border-gray-500 p-2"
				/>
				<input
					type="password"
					name="password"
					placeholder="Password"
					className="rounded-md border-2 border-gray-500 p-2"
				/>
				<button className="rounded-md bg-blue-500 p-2 text-white">Login</button>
			</form>
		</div>
	);
}
