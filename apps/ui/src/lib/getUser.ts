import { getSession } from "./auth-client";

export async function getUser() {
	// Use better-auth's getSession instead of a custom fetch
	const { data: session } = await getSession();

	return session?.user;
}
