import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-xl items-center justify-center py-10">
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Page not found</CardTitle>
          <CardDescription>
            This page may have moved, or the profile you are looking for does
            not exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">Back to home</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
