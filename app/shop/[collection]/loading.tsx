export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-10 text-black">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="mt-3 h-10 w-72 rounded bg-zinc-200" />
          </div>
          <div className="h-10 w-32 rounded-full bg-zinc-200" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-9 w-24 rounded-full bg-zinc-200" />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="aspect-[4/5] bg-zinc-200" />
              <div className="p-4">
                <div className="h-5 w-3/4 rounded bg-zinc-200" />
                <div className="mt-2 h-3 w-24 rounded bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
