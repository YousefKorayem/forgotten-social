import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { SignInForm } from "./sign-in-form";

function safeCallbackUrl(url: string | string[] | undefined): string {
  const raw = Array.isArray(url) ? url[0] : url;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function SignInPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
}>) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center py-8">
      <SignInForm callbackUrl={callbackUrl} errorCode={errorCode} />
    </div>
  );
}
