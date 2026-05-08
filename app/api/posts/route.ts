import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Like from "@/models/Like";
import Post from "@/models/Post";
import { createPostSchema } from "@/lib/validations/post";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const feedLimitSchema = z.number().int().min(1).max(MAX_LIMIT);

type PopulatedAuthor = {
  _id: mongoose.Types.ObjectId;
  username: string;
  name: string;
  image?: string;
};

type LeanPost = {
  _id: mongoose.Types.ObjectId;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: PopulatedAuthor;
};

function serializeAuthor(author: PopulatedAuthor) {
  return {
    id: author._id.toString(),
    username: author.username,
    name: author.name,
    image: author.image ?? null,
  };
}

function serializePost(doc: LeanPost, likedByMe?: boolean) {
  const row = {
    id: doc._id.toString(),
    content: doc.content,
    likeCount: doc.likeCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    author: serializeAuthor(doc.author),
  };
  return likedByMe === undefined
    ? row
    : { ...row, likedByMe };
}

function parseCursorParam(cursorParam: string | null):
  | { ok: true; cursorId: null }
  | { ok: true; cursorId: mongoose.Types.ObjectId }
  | { ok: false } {
  if (cursorParam == null || cursorParam === "") {
    return { ok: true, cursorId: null };
  }
  if (!mongoose.Types.ObjectId.isValid(cursorParam)) {
    return { ok: false };
  }
  return { ok: true, cursorId: new mongoose.Types.ObjectId(cursorParam) };
}

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
      author: new mongoose.Types.ObjectId(session.user.id),
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
    const session = await auth();
    const viewerId =
      session?.user?.id != null
        ? new mongoose.Types.ObjectId(session.user.id)
        : null;

    const filter =
      cursorResult.cursorId != null
        ? { _id: { $lt: cursorResult.cursorId } }
        : {};

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
