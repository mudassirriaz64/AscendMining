import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  page,
  total,
  limit,
  onPageChange,
  currentPage,
  totalItems,
  itemsPerPage,
  totalPages,
}) => {
  const activePage = page || currentPage || 1;
  const activeLimit = limit || itemsPerPage || 20;
  const activeTotalPages = totalPages || (totalItems ? Math.ceil(totalItems / activeLimit) : (total ? Math.ceil(total / activeLimit) : 1));
  const activeTotal = total || totalItems || (activeTotalPages * activeLimit);

  if (activeTotalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
  let end = Math.min(activeTotalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-1 py-4 text-xs">
      <p className="text-slate-400">
        Showing {((activePage - 1) * activeLimit) + 1}–{Math.min(activePage * activeLimit, activeTotal)} of {activeTotal}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage === 1}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-xl text-xs font-semibold cursor-pointer transition-all
              ${p === activePage
                ? 'bg-primary-container text-slate-950 border border-primary-container/20 shadow-[0_0_12px_rgba(255,184,0,0.25)]'
                : 'text-slate-350 hover:bg-white/5 border border-white/10'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage === activeTotalPages}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default memo(Pagination);
