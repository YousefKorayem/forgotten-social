import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { requireExistingUserBySessionUserId } from "@/lib/require-session-user";
import Like from "@/models/Like";
import Post from "@/models/Post";

export const runtime = "nodejs";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[like POST] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await requireExistingUserBySessionUserId(session.user.id);
  if (!viewer.ok) return viewer.response;

  const { id: rawId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const postId = new mongoose.Types.ObjectId(rawId);
  const userId = viewer.userId;

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    await Like.create({ user: userId, post: postId });
    await Post.updateOne({ _id: postId }, { $inc: { likeCount: 1 } });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const post = await Post.findById(postId).select("likeCount").lean().exec();
      return NextResponse.json({
        liked: true,
        likeCount: post?.likeCount ?? 0,
      });
    }
    console.error("[like POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const post = await Post.findById(postId).select("likeCount").lean().exec();
  return NextResponse.json({
    liked: true,
    likeCount: post?.likeCount ?? 0,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[like DELETE] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await requireExistingUserBySessionUserId(session.user.id);
  if (!viewer.ok) return viewer.response;

  const { id: rawId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const postId = new mongoose.Types.ObjectId(rawId);
  const userId = viewer.userId;

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const result = await Like.deleteOne({ user: userId, post: postId });
    if (result.deletedCount > 0) {
      await Post.updateOne({ _id: postId }, { $inc: { likeCount: -1 } });
    }
  } catch (error) {
    console.error("[like DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
