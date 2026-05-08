"use client";

import { signOut } from "next-auth/react";

export function isSessionExpiredPayload(
  payload: unknown
): payload is { error: "Session expired" } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    (payload as { error?: string }).error === "Session expired"
  );
}

export async function signOutIfSessionExpiredPayload(payload: unknown): Promise<boolean> {
  if (!isSessionExpiredPayload(payload)) return false;
  await signOut({ redirect: false });
  return true;
}
