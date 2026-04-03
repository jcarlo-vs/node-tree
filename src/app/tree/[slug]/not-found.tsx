import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Family tree not found</h1>
      <p className="text-muted-foreground">
        This tree may have been deleted or the link is incorrect.
      </p>
      <Link
        href="/"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Create a new tree
      </Link>
    </div>
  );
}
