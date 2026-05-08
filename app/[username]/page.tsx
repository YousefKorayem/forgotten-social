import { NewspaperIcon } from "@phosphor-icons/react/ssr";
import mongoose, { type Types } from "mongoose";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/follow-button";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import {
  serializePost,
  type LeanPostWithAuthor,
} from "@/lib/serialize-feed-post";
import Follow from "@/models/Follow";
import Like from "@/models/Like";
import Post from "@/models/Post";
import User from "@/models/User";

export const runtime = "nodejs";

const POST_LIMIT = 20;

type ProfilePageProps = Readonly<{
  params: Promise<{
    username: string;
  }>;
}>;

type LeanProfileUser = {
  _id: Types.ObjectId;
  username: string;
  name: string;
  image?: string | null;
  bio?: string | null;
};

function initials(name: string, username: string): string {
  const trimmed = name.trim();
  if (trimmed.length > 0) {
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  }
  return username.slice(0, 2).toUpperCase();
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: usernameParam } = await params;
  const username = usernameParam.toLowerCase();

  await dbConnect();

  const user = (await User.findOne({ username })
    .select("username name image bio")
    .lean()
    .exec()) as LeanProfileUser | null;

  if (!user) {
    notFound();
  }

  const session = await auth();
  const viewerUsername = session?.user?.username ?? null;
  const isOwnProfile =
    viewerUsername != null && viewerUsername === user.username;
  const showFollowButton = !!session?.user?.id && !isOwnProfile;

  let initialFollowing = false;
  if (session?.user?.id && !isOwnProfile) {
    initialFollowing = !!(await Follow.exists({
      follower: new mongoose.Types.ObjectId(session.user.id),
      following: user._id,
    }));
  }

  const [followersCount, followingCount, posts] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Post.find({ author: user._id })
      .sort({ _id: -1 })
      .limit(POST_LIMIT + 1)
      .populate<{ username: string; name: string; image?: string | null }>({
        path: "author",
        select: "username name image",
      })
      .lean()
      .exec() as unknown as Promise<LeanPostWithAuthor[]>,
  ]);

  const hasMorePosts = posts.length > POST_LIMIT;
  const visiblePosts = hasMorePosts ? posts.slice(0, POST_LIMIT) : posts;

  let likedPostIds = new Set<string>();
  if (session?.user?.id && visiblePosts.length > 0) {
    const likes = await Like.find({
      user: new mongoose.Types.ObjectId(session.user.id),
      post: { $in: visiblePosts.map((p) => p._id) },
    })
      .select("post")
      .lean()
      .exec();
    likedPostIds = new Set(
      likes.map((l) => (l.post as mongoose.Types.ObjectId).toString())
    );
  }

  const feedPosts = visiblePosts.map((doc) =>
    serializePost(
      doc,
      typeof session?.user?.id === "string"
        ? likedPostIds.has(doc._id.toString())
        : undefined
    )
  );

  return (
    <div className="mx-auto w-full max-w-xl pb-8">
      <section className="mb-8 overflow-hidden border border-border bg-card">
        <div className="h-24 border-b border-border bg-muted/40" aria-hidden />
        <div className="space-y-5 px-4 pb-5 pt-0">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <Avatar className="size-20 ring-4 ring-background">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback className="text-lg">
                {initials(user.name, user.username)}
              </AvatarFallback>
            </Avatar>
            <FollowButton
              profileUsername={user.username}
              initialFollowing={initialFollowing}
              visible={showFollowButton}
            />
          </div>

          <div className="space-y-2">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-foreground">
                {user.name}
              </h1>
              <p className="break-all text-sm text-muted-foreground">
                @{user.username}
              </p>
            </div>
            <p className="min-h-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {user.bio?.trim() ? user.bio : "No bio yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span>
              <strong className="font-semibold text-foreground">
                {followingCount.toLocaleString()}
              </strong>{" "}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span>
              <strong className="font-semibold text-foreground">
                {followersCount.toLocaleString()}
              </strong>{" "}
              <span className="text-muted-foreground">
                {followersCount === 1 ? "Follower" : "Followers"}
              </span>
            </span>
          </div>
        </div>
      </section>

      <section aria-label={`${user.name}'s posts`} className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Posts
          </h2>
          <p className="text-sm text-muted-foreground">
            {feedPosts.length > 0
              ? countLabel(feedPosts.length, "latest post", "latest posts")
              : "Nothing posted yet."}
          </p>
        </div>

        {feedPosts.length > 0 ? (
          <div className="rounded-none border border-border bg-card">
            <div className="divide-y divide-border px-4">
              {feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  className="border-b-0 first:pt-4 last:pb-4"
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <NewspaperIcon
                  className="size-6 text-muted-foreground"
                  weight="duotone"
                />
              </div>
              <p className="text-base font-semibold tracking-tight text-foreground">
                No posts yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                @{user.username} has not shared anything yet. Their posts will
                appear here when they do.
              </p>
            </CardContent>
          </Card>
        )}

        {hasMorePosts ? (
          <p className="text-center text-xs text-muted-foreground">
            Showing the latest {POST_LIMIT.toLocaleString()} posts.
          </p>
        ) : null}
      </section>
    </div>
  );
}
