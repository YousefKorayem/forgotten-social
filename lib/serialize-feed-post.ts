import type { Types } from "mongoose";

import type { FeedPost } from "@/types/feed";

type LeanAuthor = {
  _id: Types.ObjectId | string;
  username: string;
  name: string;
  image?: string | null;
};

export type LeanPostWithAuthor = {
  _id: Types.ObjectId | string;
  content: string;
  likeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: LeanAuthor;
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function serializePost(doc: LeanPostWithAuthor, likedByMe?: boolean): FeedPost {
  const base: FeedPost = {
    id: doc._id.toString(),
    content: doc.content,
    likeCount: doc.likeCount,
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
    author: {
      id: doc.author._id.toString(),
      username: doc.author.username,
      name: doc.author.name,
      image: doc.author.image ?? null,
    },
  };
  if (likedByMe !== undefined) {
    base.likedByMe = likedByMe;
  }
  return base;
}
