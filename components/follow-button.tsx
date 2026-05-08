"use client";

import { UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type FollowButtonProps = Readonly<{
  profileUsername: string;
  initialFollowing: boolean;
  /** When false, render nothing (logged out or viewing own profile). */
  visible: boolean;
}>;

export function FollowButton({
  profileUsername,
  initialFollowing,
  visible,
}: FollowButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, profileUsername]);

  if (!visible) {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        className="h-9 min-w-[7rem] animate-pulse rounded-full bg-muted"
        aria-hidden
      />
    );
  }

  if (!session?.user || session.user.username === profileUsername) {
    return null;
  }

  async function follow() {
    const previous = following;
    setFollowing(true);
    setPending(true);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(profileUsername)}/follow`,
        { method: "POST" }
      );

      if (!res.ok) {
        setFollowing(previous);
        return;
      }

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function unfollow() {
    const previous = following;
    setFollowing(false);
    setPending(true);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(profileUsername)}/follow`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        setFollowing(previous);
        return;
      }

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "default"}
      size="sm"
      className="rounded-full"
      disabled={pending}
      onClick={following ? unfollow : follow}
    >
      {following ? (
        <>
          <UsersIcon className="size-4" weight="regular" />
          Following
        </>
      ) : (
        <>
          <UserPlusIcon className="size-4" weight="regular" />
          Follow
        </>
      )}
    </Button>
  );
}
