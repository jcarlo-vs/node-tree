"use client";

import { Button } from "@/components/ui/button";

export default function TreeError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        Failed to load this tree. It may have been deleted or there was a server error.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Go home
        </Button>
      </div>
    </div>
  );
}
