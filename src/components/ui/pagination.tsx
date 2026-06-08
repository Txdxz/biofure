import Link from "next/link";

export default function Pagination({ total, page, basePath, pageSize = 20 }: { total: number; page: number; basePath: string; pageSize?: number }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  function href(p: number) {
    const url = new URL(basePath, "http://x");
    url.searchParams.set("page", String(p));
    return url.pathname + url.search;
  }

  return (
    <div className="flex items-center gap-2 justify-center pt-4 text-sm">
      {page > 1 && <Link href={href(page - 1)} className="px-3 py-1 border rounded hover:bg-gray-50">上一页</Link>}
      {start > 1 && <Link href={href(1)} className="px-3 py-1 border rounded hover:bg-gray-50">1</Link>}
      {start > 2 && <span className="px-2 text-gray-400">...</span>}
      {pages.map(p => (
        <Link key={p} href={href(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-primary text-white border-primary" : "hover:bg-gray-50"}`}>{p}</Link>
      ))}
      {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
      {end < totalPages && <Link href={href(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-50">{totalPages}</Link>}
      {page < totalPages && <Link href={href(page + 1)} className="px-3 py-1 border rounded hover:bg-gray-50">下一页</Link>}
    </div>
  );
}
