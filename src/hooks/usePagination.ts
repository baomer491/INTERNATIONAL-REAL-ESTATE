'use client';
import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export function usePagination({ totalItems, pageSize = 10, initialPage = 1 }: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp current page
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedItems = useMemo(() => {
    // Returns slice indices, consumer applies to array
    return { start: startIndex, end: endIndex };
  }, [startIndex, endIndex]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const nextPage = () => goToPage(safePage + 1);
  const prevPage = () => goToPage(safePage - 1);

  return {
    currentPage: safePage,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    pageSize,
  };
}
