import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import {
  DEFAULT_LIMIT,
  feedLimitSchema,
  LeanPost,
  parseCursorParam,
  serializePost,
} from "@/lib/post-feed-shared";
import Follow from "@/models/Follow";
import Like from "@/models/Like";
import Post from "@/models/Post";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("[posts/feed GET] dbConnect", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewerId = new mongoose.Types.ObjectId(session.user.id);

  const { searchParams } = new URL(request.url);
  const cursorResult = parseCursorParam(searchParams.get("cursor"));
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
    const followRows = await Follow.find({ follower: viewerId })
      .select("following")
      .lean()
      .exec();

    const followingIds = followRows.map(
      (f) => f.following as mongoose.Types.ObjectId
    );

    if (followingIds.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }

    const filter: Record<string, unknown> = {
      author: { $in: followingIds },
    };
    if (cursorResult.cursorId != null) {
      filter._id = { $lt: cursorResult.cursorId };
    }

    const items = (await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate<{ username: string; name: string; image?: string }>({
        path: "author",
        select: "username name image",
      })
      .lean()
      .exec()) as unknown as LeanPost[];

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1]._id.toString() : null;

    let likedIds = new Set<string>();
    if (page.length > 0) {
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
        serializePost(doc, likedIds.has(doc._id.toString()))
      ),
      nextCursor,
    });
  } catch (error) {
    console.error("[posts/feed GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
