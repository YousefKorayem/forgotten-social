"use client";

import { HeartIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { signOutIfSessionExpiredPayload } from "@/lib/session-expired-client";
import type { FeedPost } from "@/types/feed";
import { cn } from "@/lib/utils";

type LikeJson = Readonly<{
  liked?: boolean;
  likeCount?: number;
}>;

type LikeButtonProps = Readonly<{
  post: FeedPost;
  className?: string;
}>;

export function LikeButton({ post, className }: LikeButtonProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const callbackUrl = encodeURIComponent(pathname || "/");

  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [count, setCount] = useState(post.likeCount);
  const [pending, setPending] = useState(false);
  const [authHint, setAuthHint] = useState<string | null>(null);

  useEffect(() => {
    setLiked(post.likedByMe ?? false);
    setCount(post.likeCount);
  }, [post.id, post.likedByMe, post.likeCount]);

  if (status === "loading") {
    return (
      <div className={cn("flex items-center gap-1.5 pt-1", className)} aria-hidden>
        <div className="size-4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-7 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const signedIn = !!session?.user;

  async function toggle() {
    if (!signedIn || pending) return;
    setAuthHint(null);
    const nextLiked = !liked;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    setPending(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });

      if (res.status === 401) {
        setLiked(prevLiked);
        setCount(prevCount);
        let payload: unknown = null;
        try {
          payload = await res.json();
        } catch {
          /* ignore */
        }
        if (await signOutIfSessionExpiredPayload(payload)) {
          setAuthHint(
            "Your session is no longer valid. Please sign in again."
          );
          return;
        }
        setAuthHint("You need to sign in to like posts.");
        return;
      }

      if (nextLiked) {
        if (!res.ok) {
          setLiked(prevLiked);
          setCount(prevCount);
          return;
        }
        let body: LikeJson | null = null;
        try {
          body = (await res.json()) as LikeJson;
        } catch {
          setLiked(prevLiked);
          setCount(prevCount);
          return;
        }
        if (typeof body?.likeCount === "number") {
          setCount(body.likeCount);
        }
        setLiked(true);
        return;
      }

      if (!res.ok && res.status !== 204) {
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } finally {
      setPending(false);
    }
  }

  if (!signedIn) {
    return (
      <div className={cn("pt-1", className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={`/sign-in?callbackUrl=${callbackUrl}`}>
            <HeartIcon className="size-4" weight="regular" aria-hidden />
            <span className="text-xs tabular-nums">{count}</span>
            <span className="sr-only">likes. Sign in to like.</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 pt-1", className)}>
      {authHint ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span>{authHint}</span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-10 shrink-0"
              asChild
            >
              <Link href={`/sign-in?callbackUrl=${callbackUrl}`}>Sign in</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={cn(
          "min-h-10 gap-1.5 px-2",
          liked
            ? "text-rose-600 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-500"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => void toggle()}
        aria-pressed={liked}
      >
        <HeartIcon className="size-4" weight={liked ? "fill" : "regular"} aria-hidden />
        <span className="text-xs tabular-nums">{count}</span>
        <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
      </Button>
    </div>
  );
}
