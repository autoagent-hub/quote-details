import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonQuoteForm() {
  return (
    <div className="min-h-screen bg-surface pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </header>

      {/* Main Form Skeleton */}
      <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
        {/* Title / Intro */}
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-48 mx-auto rounded-md" />
          <Skeleton className="h-4 w-64 mx-auto rounded-sm" />
        </div>

        {/* Vehicle Selection Skeleton */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border/60 flex flex-col items-center gap-2"
              >
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Packages Skeleton */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-40 rounded-sm" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/60 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-sm" />
                  <Skeleton className="h-3 w-44 rounded-sm" />
                </div>
                <Skeleton className="h-6 w-14 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Estimate Box Skeleton */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
