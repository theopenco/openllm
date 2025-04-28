import { createFileRoute } from "@tanstack/react-router";
import { signIn } from "next-auth/react";

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
			alert("Please enter an email and password.");
			return;
		}

		const res = await signIn("credentials", {
			redirectTo: "/dashboard",
			redirect: false,
			email,
			password,
		});

		if (res.error) {
			alert(res.error);
			return;
		}

		window.location.href = res.url!;
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
