"use server"

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getSession = async () => {
  // Force headers() to be called to ensure we're in a request context
  headers();
  const session = await auth();
  return session;
};
