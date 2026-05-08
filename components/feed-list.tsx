"use client";

import { NewspaperIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";
import type { FeedPost, PostsApiResponse } from "@/types/feed";

const PAGE_LIMIT = 20;

type ErrorBody = {
  error?: string;
};

type FeedListProps = {
  /** When set, merged at the top of the list (e.g. newly created post). */
  injectPost?: FeedPost | null;
  onInjectConsumed?: () => void;
};

export function FeedList({ injectPost, onInjectConsumed }: FeedListProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/posts?${params.toString()}`);

    let body: PostsApiResponse | ErrorBody | null = null;
    try {
      body = (await res.json()) as PostsApiResponse | ErrorBody;
    } catch {
      throw new Error("Bad response");
    }

    if (!res.ok) {
      const err = body as ErrorBody;
      throw new Error(err.error ?? "Could not load posts.");
    }

    return body as PostsApiResponse;
  }, []);

  const retryInitial = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPage(null)
      .then((data) => {
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load posts.");
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPage(null)
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load posts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  useEffect(() => {
    if (!injectPost) return;
    setPosts((prev) => {
      if (prev.some((p) => p.id === injectPost.id)) return prev;
      return [injectPost, ...prev];
    });
    onInjectConsumed?.();
  }, [injectPost, onInjectConsumed]);

  const loadMore = useCallback(async () => {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchPage(nextCursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = data.posts.filter((p) => !seen.has(p.id));
        return [...prev, ...merged];
      });
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load more.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || nextCursor == null) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) void loadMore();
      },
      { rootMargin: "240px", threshold: 0 }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [nextCursor, loadMore]);

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading posts…
        </CardContent>
      </Card>
    );
  }

  if (error && posts.length === 0) {
    return (
      <Alert variant="destructive">
        <WarningCircleIcon size={16} weight="regular" />
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => retryInitial()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <NewspaperIcon className="size-10 text-muted-foreground" weight="duotone" />
          <p className="text-sm font-medium text-foreground">No posts yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When people share something, it will show up here. Be the first to post.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <WarningCircleIcon size={16} weight="regular" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-none border border-border bg-card">
        <div className="divide-y divide-border px-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} className="border-b-0 first:pt-4 last:pb-4" />
          ))}
        </div>
      </div>

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

      {nextCursor != null ? (
        <div className="flex justify-center py-4">
          {loadingMore ? (
            <p className="text-xs text-muted-foreground">Loading more…</p>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()}>
              Load more
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
