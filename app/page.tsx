import { HomeFeed } from "@/components/home-feed";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-xl pb-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Home
        </h1>
        <p className="text-sm text-muted-foreground">
          Global feed — newest posts from everyone.
        </p>
      </div>
      <HomeFeed />
    </div>
  );
}
