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

export function parseCursorParam(cursorParam: string | null):
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
