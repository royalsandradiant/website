import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "@/app/lib/utils";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
