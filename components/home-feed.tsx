"use client";

import { useCallback, useState } from "react";

import { Composer } from "@/components/composer";
import { FeedList } from "@/components/feed-list";
import type { FeedPost } from "@/types/feed";

export function HomeFeed() {
  const [injectPost, setInjectPost] = useState<FeedPost | null>(null);

  const handleInjectConsumed = useCallback(() => {
    setInjectPost(null);
  }, []);

  return (
    <div className="space-y-8">
      <Composer onPostCreated={(post) => setInjectPost(post)} />
      <section aria-label="Global feed">
        <h2 className="sr-only">Latest posts</h2>
        <FeedList injectPost={injectPost} onInjectConsumed={handleInjectConsumed} />
      </section>
    </div>
  );
}
