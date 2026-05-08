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
          />
        </section>
      </TabsContent>
      <TabsContent value="following" className="mt-0">
        <section aria-label="Following feed">
          <h2 className="sr-only">Posts from people you follow</h2>
          <FeedList
            apiPath="/api/posts/feed"
            emptyTitle="Nothing here yet"
            emptyDescription="Posts from accounts you follow will appear here. Follow people from their profiles to fill this feed."
          />
        </section>
      </TabsContent>
    </Tabs>
  );
}
