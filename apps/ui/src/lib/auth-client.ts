import { passkeyClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { API_URL } from "@/lib/env";

// @ts-ignore
export const authClient = createAuthClient({
	baseURL: API_URL + "/auth",
	plugins: [passkeyClient()],
});

// Export commonly used methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
