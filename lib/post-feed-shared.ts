import mongoose from "mongoose";
import { z } from "zod";

import { FEED_DEFAULT_LIMIT, FEED_MAX_LIMIT } from "@/lib/feed-constants";

export const DEFAULT_LIMIT = FEED_DEFAULT_LIMIT;
export const MAX_LIMIT = FEED_MAX_LIMIT;

export const feedLimitSchema = z.number().int().min(1).max(MAX_LIMIT);

export type PopulatedAuthor = {
  _id: mongoose.Types.ObjectId;
  username: string;
  name: string;
  image?: string;
};

export type LeanPost = {
  _id: mongoose.Types.ObjectId;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: PopulatedAuthor;
};

export function serializeAuthor(author: PopulatedAuthor) {
  return {
    id: author._id.toString(),
    username: author.username,
    name: author.name,
    image: author.image ?? null,
  };
}

export function serializePost(doc: LeanPost, likedByMe?: boolean) {
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

/** Cursor for newest-first feeds: wall-clock recency, not raw ObjectId order (seed data can use synthetic ids). */
export type FeedCursorBefore = {
  at: Date;
  id: mongoose.Types.ObjectId;
};

export function encodeFeedCursor(at: Date, id: mongoose.Types.ObjectId): string {
  return Buffer.from(
    JSON.stringify({ t: at.getTime(), id: id.toString() }),
    "utf8"
  ).toString("base64url");
}

export function parseFeedCursor(cursorParam: string | null):
  | { ok: true; before: null }
  | { ok: true; before: FeedCursorBefore }
  | { ok: false } {
  if (cursorParam == null || cursorParam === "") {
    return { ok: true, before: null };
  }
  try {
    const raw = Buffer.from(cursorParam, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { t?: unknown; id?: unknown };
    if (typeof parsed.t !== "number" || typeof parsed.id !== "string") {
      return { ok: false };
    }
    if (!mongoose.Types.ObjectId.isValid(parsed.id)) {
      return { ok: false };
    }
    return {
      ok: true,
      before: {
        at: new Date(parsed.t),
        id: new mongoose.Types.ObjectId(parsed.id),
      },
    };
  } catch {
    return { ok: false };
  }
}

export function cursorOlderThanFilter(before: FeedCursorBefore) {
  return {
    $or: [
      { createdAt: { $lt: before.at } },
      { createdAt: before.at, _id: { $lt: before.id } },
    ],
  };
}
