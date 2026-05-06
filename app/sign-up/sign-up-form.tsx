"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
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
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";

type RegisterErrorBody = {
  error?: string;
  details?: {
    fieldErrors?: Partial<Record<keyof RegisterInput, string[]>>;
  };
};

export function SignUpForm() {
  const router = useRouter();
  const [topError, setTopError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setTopError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    let body: RegisterErrorBody | null = null;
    try {
      body = (await res.json()) as RegisterErrorBody;
    } catch {
      setTopError("Something went wrong. Please try again.");
      return;
    }

    if (!res.ok) {
      const fieldErrors = body.details?.fieldErrors;
      if (fieldErrors) {
        (Object.keys(fieldErrors) as (keyof RegisterInput)[]).forEach(
          (key) => {
            const messages = fieldErrors[key];
            const msg = messages?.[0];
            if (msg) {
              form.setError(key, { message: msg });
            }
          }
        );
      }

      if (body.error) {
        if (res.status === 409 || !fieldErrors) {
          setTopError(body.error);
        }
      }

      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.error) {
      setTopError(
        "Account created but sign-in failed. Try signing in manually."
      );
      return;
    }

    if (signInResult?.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Choose a username and enter your details to join ForgottenSocial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topError ? (
          <Alert variant="destructive">
            <WarningCircleIcon size={16} weight="regular" />
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="username"
                      placeholder="your_handle"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Create account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
