"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

import { Composer } from "@/components/composer";
import { FeedList } from "@/components/feed-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedPost } from "@/types/feed";

export function HomeFeed() {
  const { data: session, status } = useSession();
  const [injectPost, setInjectPost] = useState<FeedPost | null>(null);

  const handleInjectConsumed = useCallback(() => {
    setInjectPost(null);
  }, []);

  const signedIn = status === "authenticated" && !!session?.user;

  if (!signedIn) {
    return (
      <div className="space-y-8">
        <Composer onPostCreated={(post) => setInjectPost(post)} />
        <section aria-label="Global feed">
          <h2 className="sr-only">Latest posts</h2>
          <FeedList
            injectPost={injectPost}
            onInjectConsumed={handleInjectConsumed}
            emptyDescription="Be the first to share a thought. New posts appear here as the community starts talking."
          />
        </section>
      </div>
    );
  }

  return (
    <Tabs defaultValue="for-you" className="w-full gap-4">
      <TabsList variant="line" className="grid h-9 w-full grid-cols-2">
        <TabsTrigger value="for-you">For you</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>
      <TabsContent value="for-you" className="mt-0 space-y-8">
        <Composer onPostCreated={(post) => setInjectPost(post)} />
        <section aria-label="Global feed">
          <h2 className="sr-only">Latest posts</h2>
          <FeedList
            injectPost={injectPost}
            onInjectConsumed={handleInjectConsumed}
            emptyDescription="Be the first to share a thought. New posts appear here as the community starts talking."
          />
        </section>
      </TabsContent>
      <TabsContent value="following" className="mt-0">
        <section aria-label="Following feed">
          <h2 className="sr-only">Posts from people you follow</h2>
          <FeedList
            apiPath="/api/posts/feed"
            emptyTitle="Your following feed is quiet"
            emptyDescription="Follow people from their profiles and their newest posts will collect here. If they have not posted yet, check back soon."
          />
        </section>
      </TabsContent>
    </Tabs>
  );
}
