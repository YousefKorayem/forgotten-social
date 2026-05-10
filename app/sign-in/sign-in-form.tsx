"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleNotchIcon,
  GithubLogoIcon,
  GoogleLogoIcon,
  SignInIcon,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

type SignInFormProps = Readonly<{
  callbackUrl: string;
  errorCode?: string;
}>;

function mapAuthError(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "oauth_email_missing") {
    return "Your OAuth provider did not return an email address. Try another account.";
  }
  return "Unable to sign in. Please try again.";
}

export function SignInForm({ callbackUrl, errorCode }: SignInFormProps) {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(() =>
    mapAuthError(errorCode)
  );
  const [oauthSubmitting, setOauthSubmitting] = useState<
    "github" | "google" | null
  >(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password");
      return;
    }

    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function onOAuthSignIn(provider: "github" | "google") {
    setAuthError(null);
    setOauthSubmitting(provider);
    try {
      /**
       * Full-page redirect is required for a reliable OAuth/PKCE flow; the
       * provider sends the user back to callbackUrl after approval.
       */
      await signIn(provider, { callbackUrl });
    } finally {
      setOauthSubmitting(null);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full gap-2"
            onClick={() => onOAuthSignIn("github")}
            disabled={oauthSubmitting !== null || form.formState.isSubmitting}
            aria-busy={oauthSubmitting === "github"}
          >
            {oauthSubmitting === "github" ? (
              <CircleNotchIcon
                size={16}
                className="animate-spin"
                aria-hidden
              />
            ) : (
              <GithubLogoIcon size={16} aria-hidden />
            )}
            {oauthSubmitting === "github"
              ? "Redirecting to GitHub…"
              : "Continue with GitHub"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full gap-2"
            onClick={() => onOAuthSignIn("google")}
            disabled={oauthSubmitting !== null || form.formState.isSubmitting}
            aria-busy={oauthSubmitting === "google"}
          >
            {oauthSubmitting === "google" ? (
              <CircleNotchIcon
                size={16}
                className="animate-spin"
                aria-hidden
              />
            ) : (
              <GoogleLogoIcon size={16} aria-hidden />
            )}
            {oauthSubmitting === "google"
              ? "Redirecting to Google…"
              : "Continue with Google"}
          </Button>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          You&apos;ll open GitHub or Google in this tab, then return here after
          you approve access.
        </p>
        <p className="text-muted-foreground text-center text-xs">
          Or continue with your email and password
        </p>
        {authError ? (
          <Alert variant="destructive">
            <SignInIcon size={16} weight="regular" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="min-h-10 w-full"
              disabled={form.formState.isSubmitting}
            >
              Sign in
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-foreground underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
