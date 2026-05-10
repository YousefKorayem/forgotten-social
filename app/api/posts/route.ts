import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { requireExistingUserBySessionUserId } from "@/lib/require-session-user";
import {
  cursorOlderThanFilter,
  DEFAULT_LIMIT,
  encodeFeedCursor,
  feedLimitSchema,
  LeanPost,
  parseFeedCursor,
  serializePost,
} from "@/lib/post-feed-shared";
import Like from "@/models/Like";
import Post from "@/models/Post";
import { createPostSchema } from "@/lib/validations/post";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[posts POST] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await requireExistingUserBySessionUserId(session.user.id);
  if (!viewer.ok) return viewer.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const post = await Post.create({
      author: viewer.userId,
      content: parsed.data.content,
    });

    const created = await Post.findById(post._id)
      .populate<{ username: string; name: string; image?: string }>({
        path: "author",
        select: "username name image",
      })
      .lean()
      .exec();

    if (!created) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(
      { post: serializePost(created as unknown as LeanPost, false) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[posts POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[posts GET] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const cursorResult = parseFeedCursor(searchParams.get("cursor"));
  if (!cursorResult.ok) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  let limit = DEFAULT_LIMIT;
  const limitStr = searchParams.get("limit");
  if (limitStr != null && limitStr !== "") {
    const n = Number.parseInt(limitStr, 10);
    const limitParsed = feedLimitSchema.safeParse(n);
    if (!limitParsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: limitParsed.error.flatten() },
        { status: 400 }
      );
    }
    limit = limitParsed.data;
  }

  try {
    const session = await auth();
    const viewerId =
      session?.user?.id != null
        ? new mongoose.Types.ObjectId(session.user.id)
        : null;

    const filter =
      cursorResult.before != null ? cursorOlderThanFilter(cursorResult.before) : {};

    const items = (await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate<{ username: string; name: string; image?: string }>({
        path: "author",
        select: "username name image",
      })
      .lean()
      .exec()) as unknown as LeanPost[];

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const last = page.length > 0 ? page[page.length - 1] : null;
    const nextCursor =
      hasMore && last != null
        ? encodeFeedCursor(last.createdAt, last._id)
        : null;

    let likedIds = new Set<string>();
    if (viewerId != null && page.length > 0) {
      const postIds = page.map((p) => p._id);
      const likes = await Like.find({
        user: viewerId,
        post: { $in: postIds },
      })
        .select("post")
        .lean()
        .exec();
      likedIds = new Set(
        likes.map((l) => (l.post as mongoose.Types.ObjectId).toString())
      );
    }

    return NextResponse.json({
      posts: page.map((doc) =>
        serializePost(doc, viewerId != null ? likedIds.has(doc._id.toString()) : undefined)
      ),
      nextCursor,
    });
  } catch (error) {
    console.error("[posts GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
