export default function Skeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            <div className="h-6 bg-gray-100 rounded-full w-full mt-3"></div>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}
