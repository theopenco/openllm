import { passkeyClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [passkeyClient()],
});

// Export commonly used methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
