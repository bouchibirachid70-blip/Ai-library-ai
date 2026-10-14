import Link from "next/link";
import { Home, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mt-6 text-6xl font-bold tracking-tight text-foreground">
            404
          </p>
          <h1 className="mt-3 text-xl font-semibold">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist, may have been
            moved, or the URL is incorrect.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/">
                <Home className="mr-1.5 h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tools">Browse tools</Link>
            </Button>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
