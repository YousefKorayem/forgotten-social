import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { requireExistingUserBySessionUserId } from "@/lib/require-session-user";
import Follow from "@/models/Follow";
import User from "@/models/User";

export const runtime = "nodejs";

/**
 * Follow / unfollow handlers
 *
 * POST has no JSON body. We do not call `request.json()` and do not use Zod — an
 * empty body is accepted (including omitted `Content-Type`), since there is
 * nothing to validate.
 *
 * DELETE similarly has no body.
 */

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

async function resolveTargetUser(usernameParam: string) {
  const username = usernameParam.toLowerCase();
  const user = await User.findOne({ username })
    .select("_id username")
    .lean()
    .exec();
  return { username, user };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[follow POST] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await requireExistingUserBySessionUserId(session.user.id);
  if (!viewer.ok) return viewer.response;

  const { username: rawUsername } = await context.params;
  const { user: target } = await resolveTargetUser(rawUsername);

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const followerId = viewer.userId;
  if (target._id.equals(followerId)) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  try {
    await Follow.create({
      follower: followerId,
      following: target._id,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      console.error("[follow POST]", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    /* duplicate compound key — already following; treat as success (idempotent) */
  }

  const followersCount = await Follow.countDocuments({ following: target._id });

  return NextResponse.json({
    following: true,
    followersCount,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[follow DELETE] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await requireExistingUserBySessionUserId(session.user.id);
  if (!viewer.ok) return viewer.response;

  const { username: rawUsername } = await context.params;
  const { user: target } = await resolveTargetUser(rawUsername);

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const followerId = viewer.userId;
  if (target._id.equals(followerId)) {
    return NextResponse.json({ error: "Cannot unfollow yourself" }, { status: 400 });
  }

  try {
    await Follow.deleteOne({
      follower: followerId,
      following: target._id,
    });
  } catch (error) {
    console.error("[follow DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  /**
   * Idempotent unfollow: whether a row was deleted or none existed, the desired
   * state is "not following". Always **204 No Content** (no body).
   */
  return new NextResponse(null, { status: 204 });
}
