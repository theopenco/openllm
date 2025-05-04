import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});

// Export commonly used methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
