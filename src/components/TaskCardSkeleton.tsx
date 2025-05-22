// TaskCardSkeleton.tsx
export default function TaskCardSkeleton() {
  return (
    <div className="p-3 rounded-md bg-white shadow animate-pulse border">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  );
}
