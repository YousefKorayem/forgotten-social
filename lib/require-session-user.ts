import { NextResponse } from "next/server";
import mongoose from "mongoose";

import User from "@/models/User";

const SESSION_EXPIRED = NextResponse.json(
  { error: "Session expired" },
  { status: 401 }
);

/**
 * Validates that the JWT subject still exists in MongoDB (mutations only).
 * GET routes keep JWT semantics without this lookup.
 */
export async function requireExistingUserBySessionUserId(sessionUserId: string) {
  if (!mongoose.Types.ObjectId.isValid(sessionUserId)) {
    return { ok: false as const, response: SESSION_EXPIRED };
  }

  const user = await User.findById(sessionUserId)
    .select("_id username")
    .lean()
    .exec();

  if (!user) {
    return { ok: false as const, response: SESSION_EXPIRED };
  }

  return {
    ok: true as const,
    userId: user._id as mongoose.Types.ObjectId,
    username: user.username as string,
  };
}
