import { useState, useMemo } from "react";

export function usePagination<T>(data: T[], defaultPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    page: safePage,
    pageSize,
    setPage: goToPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    totalPages,
    total: data.length,
    paginatedData,
  };
}
