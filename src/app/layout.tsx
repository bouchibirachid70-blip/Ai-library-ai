import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aivora — Discover the Best AI Tools",
  description:
    "Aivora is a curated directory of the best AI tools. Browse by category, compare features, and find the right AI tool for your workflow.",
  keywords: [
    "AI tools",
    "AI directory",
    "best AI tools",
    "AI tools directory",
    "artificial intelligence",
    "AI apps",
  ],
  authors: [{ name: "Aivora" }],
  openGraph: {
    title: "Aivora — Discover the Best AI Tools",
    description:
      "A curated directory of the best AI tools, organized by category.",
    siteName: "Aivora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aivora — Discover the Best AI Tools",
    description: "A curated directory of the best AI tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
