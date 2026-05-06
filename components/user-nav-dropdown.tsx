"use client";

import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SessionUser = {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UserNavDropdownProps = {
  user: SessionUser;
};

function initials(user: SessionUser) {
  const fromName = user.name?.trim();
  if (fromName?.length) return fromName.charAt(0).toUpperCase();
  const fromUsername = user.username?.trim();
  if (fromUsername?.length) return fromUsername.charAt(0).toUpperCase();
  return "?";
}

export function UserNavDropdown({ user }: UserNavDropdownProps) {
  const displayName = user.name?.trim() || user.username;
  const email = user.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
        >
          <Avatar size="sm">
            <AvatarImage src={user.image || undefined} alt="" />
            <AvatarFallback>{initials(user)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <SignOutIcon size={16} weight="regular" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
