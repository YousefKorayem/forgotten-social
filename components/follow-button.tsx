"use client";

import { UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { signOutIfSessionExpiredPayload } from "@/lib/session-expired-client";

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
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname || "/");
  const { data: session, status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [authHint, setAuthHint] = useState<string | null>(null);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, profileUsername]);

  if (!visible) {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        className="h-10 min-w-[7rem] animate-pulse rounded-full bg-muted"
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
    setAuthHint(null);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(profileUsername)}/follow`,
        { method: "POST" }
      );

      if (!res.ok) {
        setFollowing(previous);
        let payload: unknown = null;
        try {
          payload = await res.json();
        } catch {
          /* no JSON body */
        }
        if (
          res.status === 401 &&
          (await signOutIfSessionExpiredPayload(payload))
        ) {
          setAuthHint(
            "Your session is no longer valid. Please sign in again."
          );
        }
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
    setAuthHint(null);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(profileUsername)}/follow`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        setFollowing(previous);
        let payload: unknown = null;
        try {
          payload = await res.json();
        } catch {
          /* no JSON body */
        }
        if (
          res.status === 401 &&
          (await signOutIfSessionExpiredPayload(payload))
        ) {
          setAuthHint(
            "Your session is no longer valid. Please sign in again."
          );
        }
        return;
      }

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {authHint ? (
        <Alert variant="destructive" className="max-w-sm py-2">
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
        variant={following ? "secondary" : "default"}
        size="sm"
        className="min-h-10 rounded-full px-3"
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
    </div>
  );
}
