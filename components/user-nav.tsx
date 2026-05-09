import Link from "next/link";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

import { UserNavDropdown } from "./user-nav-dropdown";

export async function UserNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Button variant="default" className="min-h-10 px-3" asChild>
        <Link href="/sign-in">Sign In</Link>
      </Button>
    );
  }

  return <UserNavDropdown user={session.user} />;
}
