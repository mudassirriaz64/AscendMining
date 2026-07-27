import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({ columns, data, loading, emptyTitle, emptyDescription, onRowClick }) => {
  if (loading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState title={emptyTitle || 'No data found'} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-light">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {data.map((row, idx) => (
            <tr
              key={row._id || idx}
              className={`transition-colors ${onRowClick ? 'hover:bg-bg-light-alt cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-text-light-bg whitespace-nowrap">
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

export default DataTable;
