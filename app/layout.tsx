import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";

import "./globals.css";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { auth } from "@/lib/auth";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-boot-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ForgottenSocial",
  description: "A social network for the things you'd like to remember.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <Script id="fs-theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <Providers session={session}>
          <header className="border-b">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
              <Link href="/" className="font-semibold">
                ForgottenSocial
              </Link>
              <div className="flex items-center gap-2">
                <UserNav />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>

          <footer className="border-t py-4 text-center text-sm text-muted-foreground">
            ForgottenSocial &mdash; built with Next.js, Mongoose, and shadcn/ui
          </footer>
        </Providers>
      </body>
    </html>
  );
}