import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingChapter() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-12 sm:px-8 lg:px-12">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </main>
  )
}
