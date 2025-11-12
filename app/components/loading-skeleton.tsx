export function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-8">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            <div className="flex space-x-4">
              <div className="h-12 bg-slate-200 rounded w-40"></div>
              <div className="h-12 bg-slate-200 rounded w-32"></div>
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <div className="aspect-[3/4] bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-slate-200 rounded-lg mb-6"></div>
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="h-10 bg-slate-200 rounded"></div>
      </div>
    </div>
  )
}
