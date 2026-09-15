import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "CodeSync",
  description: "Where developers find their missing piece.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dependency-free script to apply dark mode before React hydration
  // Prevents flash of incorrect theme
  const themeScript = `
    (function() {
      try {
        var localTheme = window.localStorage.getItem('theme');
        var sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (localTheme === 'dark' || (!localTheme && sysTheme)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased min-h-screen bg-background text-primary font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
