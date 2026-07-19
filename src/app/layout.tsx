/**
 * Root layout: HTML shell, global styles, and the landmark structure
 * (skip link → header → main → footer). Wraps the tree in {@link AppProvider}
 * so role and UI-language state is available everywhere. A system font stack is
 * used deliberately (no network font fetch) to keep builds hermetic.
 */
import type { Metadata } from "next";

import "./globals.css";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProvider } from "@/i18n/app-context";
import { en } from "@/i18n/en";

export const metadata: Metadata = {
  title: `${en.app.name} — ${en.app.tagline}`,
  description: en.home.intro,
};

/** Wraps every page with the app shell and providers. */
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AppProvider>
          <a href="#main-content" className="skip-link">
            {en.common.skipToContent}
          </a>
          <SiteHeader />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
          >
            {children}
          </main>
          <SiteFooter />
        </AppProvider>
      </body>
    </html>
  );
}
