import { memo } from 'react';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({ columns, data, loading, emptyTitle, emptyDescription, onRowClick }) => {
  if (loading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState title={emptyTitle || 'No data found'} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto bg-[#0d1420]/60 backdrop-blur-xl border border-white/10 rounded-2xl">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-white/[0.03] border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, idx) => (
            <tr
              key={row._id || idx}
              className={`text-slate-200 transition-colors ${onRowClick ? 'hover:bg-white/[0.03] cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-slate-200 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(DataTable);
