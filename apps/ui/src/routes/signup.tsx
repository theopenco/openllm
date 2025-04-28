import { createFileRoute } from "@tanstack/react-router";
import { signIn } from "next-auth/react";

export const Route = createFileRoute("/signup")({
	component: RouteComponent,
});

function RouteComponent() {
	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email");
		const password = formData.get("password");

		if (!email || !password) {
			alert("Please enter an email and password.");
			return;
		}

		const res = await fetch("/api/public/auth/register", {
			method: "POST",
			body: JSON.stringify({
				email,
				password,
			}),
		});

		if (!res.ok) {
			alert("Failed to sign up.");
			return;
		}

		await signIn("credentials", {
			redirectTo: "/dashboard",
			email,
			password,
		});
	};

	return (
		<div>
			<h1>Sign Up</h1>
			<p>Please enter your details to continue.</p>

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
				<button className="rounded-md bg-blue-500 p-2 text-white">
					Sign up
				</button>
			</form>
		</div>
	);
}
