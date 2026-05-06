"use client";

import { HeartIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import type { FeedPost } from "@/types/feed";
import { cn } from "@/lib/utils";

function initials(name: string, username: string): string {
  const trimmed = name.trim();
  if (trimmed.length > 0) {
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || username.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function PostCard({
  post,
  className,
}: {
  post: FeedPost;
  className?: string;
}) {
  const { author } = post;
  const when = formatShortRelativeTime(post.createdAt);

  return (
    <article
      className={cn(
        "border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0",
        className
      )}
    >
      <div className="flex gap-3">
        <Link
          href={`/${author.username}`}
          className="shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
        >
          <Avatar size="sm">
            {author.image ? (
              <AvatarImage src={author.image} alt="" />
            ) : null}
            <AvatarFallback>{initials(author.name, author.username)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-xs">
            <Link
              href={`/${author.username}`}
              className="truncate font-semibold text-foreground hover:underline"
            >
              {author.name}
            </Link>
            <Link
              href={`/${author.username}`}
              className="truncate text-muted-foreground hover:underline"
            >
              @{author.username}
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <time
              className="shrink-0 text-muted-foreground"
              dateTime={post.createdAt}
              title={new Date(post.createdAt).toLocaleString()}
            >
              {when}
            </time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {post.content}
          </p>
          <div className="flex items-center gap-1 pt-1 text-muted-foreground">
            <HeartIcon className="size-4" weight="regular" aria-hidden />
            <span className="text-xs tabular-nums">{post.likeCount}</span>
            <span className="sr-only">likes</span>
          </div>
        </div>
      </div>
    </article>
  );
}
