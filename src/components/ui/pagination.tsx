import Link from "next/link";

export default function Pagination({ total, page, basePath, pageSize = 20, onPageChange, showCount = true, queryParams }: { total: number; page: number; basePath?: string; pageSize?: number; onPageChange?: (page: number) => void; showCount?: boolean; queryParams?: Record<string, string> }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    if (!showCount || total === 0) return null;
    return <div className="flex items-center justify-center pt-4 text-sm text-gray-500">共 {total} 条记录</div>;
  }

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  function href(p: number) {
    const url = new URL(basePath || "/", "http://x");
    url.searchParams.set("page", String(p));
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value) url.searchParams.set(key, value);
      }
    }
    return url.pathname + url.search;
  }

  const isClient = typeof onPageChange === "function";

  return (
    <div className="flex items-center gap-3 justify-between pt-4 text-sm">
      {showCount && <span className="text-gray-500">共 {total} 条记录</span>}
      <div className="flex items-center gap-2 ml-auto">
      {page > 1 && (isClient ? (
        <button onClick={() => onPageChange!(page - 1)} className="px-3 py-1 border rounded hover:bg-gray-50">上一页</button>
      ) : (
        <Link href={href(page - 1)} className="px-3 py-1 border rounded hover:bg-gray-50">上一页</Link>
      ))}
      {start > 1 && (isClient ? (
        <button onClick={() => onPageChange!(1)} className="px-3 py-1 border rounded hover:bg-gray-50">1</button>
      ) : (
        <Link href={href(1)} className="px-3 py-1 border rounded hover:bg-gray-50">1</Link>
      ))}
      {start > 2 && <span className="px-2 text-gray-400">...</span>}
      {pages.map(p => (
        isClient ? (
          <button key={p} onClick={() => onPageChange!(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-primary text-white border-primary" : "hover:bg-gray-50"}`}>{p}</button>
        ) : (
          <Link key={p} href={href(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-primary text-white border-primary" : "hover:bg-gray-50"}`}>{p}</Link>
        )
      ))}
      {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
      {end < totalPages && (isClient ? (
        <button onClick={() => onPageChange!(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-50">{totalPages}</button>
      ) : (
        <Link href={href(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-50">{totalPages}</Link>
      ))}
      {page < totalPages && (isClient ? (
        <button onClick={() => onPageChange!(page + 1)} className="px-3 py-1 border rounded hover:bg-gray-50">下一页</button>
      ) : (
        <Link href={href(page + 1)} className="px-3 py-1 border rounded hover:bg-gray-50">下一页</Link>
      ))}
      </div>
    </div>
  );
}
