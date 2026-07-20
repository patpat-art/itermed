import { cn } from "@/app/utils/cn";

type SkeletonProps = {
  className?: string;
};

/** Pulse placeholder for perceived 60fps loading. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonChatBubble({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "max-w-[85%] space-y-2 rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3 py-2.5",
        className,
      )}
      role="status"
      aria-label="Risposta in corso"
    >
      <Skeleton className="h-2.5 w-24" />
      <SkeletonText lines={3} />
    </div>
  );
}
