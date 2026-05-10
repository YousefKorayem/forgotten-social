"use client";

import { PaperPlaneTiltIcon, SignInIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { signOutIfSessionExpiredPayload } from "@/lib/session-expired-client";
import type { FeedPost, PostCreateApiResponse } from "@/types/feed";

type ComposerProps = {
  onPostCreated?: (post: FeedPost) => void;
};

type ErrorBody = {
  error?: string;
};

export function Composer({ onPostCreated }: Readonly<ComposerProps>) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signedIn = status === "authenticated" && !!session?.user;
  const callbackUrl = pathname || "/";
  const signInHref = `/sign-in?${new URLSearchParams({ callbackUrl }).toString()}`;

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitNotice(null);

    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      let body: PostCreateApiResponse | ErrorBody | null = null;
      try {
        body = (await res.json()) as PostCreateApiResponse | ErrorBody;
      } catch {
        setSubmitError("Something went wrong. Please try again.");
        return;
      }

      if (res.status === 401) {
        if (await signOutIfSessionExpiredPayload(body)) {
          setSubmitError(
            "Your session is no longer valid. Please sign in again."
          );
          return;
        }
        setSubmitError("You need to sign in to post.");
        return;
      }

      if (!res.ok) {
        const err = body as ErrorBody;
        setSubmitError(err.error ?? "Could not publish your post.");
        return;
      }

      const created = (body as PostCreateApiResponse).post;
      if (created) {
        setContent("");
        setSubmitNotice("Posted to the feed.");
        onPostCreated?.(created);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Compose</CardTitle>
          <CardDescription>Loading session…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!signedIn) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Join the conversation</CardTitle>
          <CardDescription>
            Sign in to share a post with the global feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="min-h-10" asChild>
            <Link href={signInHref}>
              <SignInIcon className="size-4" weight="regular" />
              Sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compose</CardTitle>
        <CardDescription>What&apos;s on your mind? (max 280 characters)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {submitNotice ? (
          <Alert>
            <PaperPlaneTiltIcon size={16} weight="regular" />
            <AlertDescription>{submitNotice}</AlertDescription>
          </Alert>
        ) : null}
        {submitError ? (
          <Alert variant="destructive">
            <SignInIcon size={16} weight="regular" />
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{submitError}</span>
              {submitError.includes("sign in") ? (
                <Button variant="outline" size="sm" className="min-h-10" asChild>
                  <Link href={signInHref}>Sign in</Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="compose-content" className="sr-only">
              Post content
            </Label>
            <Textarea
              id="compose-content"
              rows={3}
              maxLength={280}
              placeholder="Write something memorable…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              className="min-h-24 resize-y text-sm md:text-sm"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">
                Keep it short and readable for the feed.
              </span>
              <span className="shrink-0 tabular-nums">
                {content.length}/280
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="min-h-10 w-full sm:w-auto"
              disabled={submitting || !content.trim()}
            >
              <PaperPlaneTiltIcon className="size-4" weight="regular" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
