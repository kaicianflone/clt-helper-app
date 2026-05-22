interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading…"
      className="divide-y divide-[color:var(--border-soft)]"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Trail name */}
              <div
                className="shimmer h-5 w-2/3 rounded"
                style={{ backgroundColor: "var(--bg-cream-deep)" }}
              />
              {/* Meta line */}
              <div
                className="shimmer h-4 w-1/3 rounded"
                style={{ backgroundColor: "var(--bg-cream-deep)" }}
              />
            </div>
            {/* Badge */}
            <div
              className="shimmer mt-1 h-5 w-24 rounded-full"
              style={{ backgroundColor: "var(--bg-cream-deep)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
