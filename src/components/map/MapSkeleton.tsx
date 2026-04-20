export function MapSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-pulse w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading map...</p>
      </div>
    </div>
  );
}
