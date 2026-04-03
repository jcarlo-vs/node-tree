import { CreateTreeForm } from "@/components/tree/create-tree-form";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            No signup required
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create Your Tree
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Family trees, org charts, mind maps, and more. Build it and share with a link.
          </p>
        </div>
        <CreateTreeForm />
      </div>
    </div>
  );
}
