import { useEffect } from 'react';
import DataTable from '../../../../components/common/DataTable';
import Pagination from '../../../../components/common/Pagination';
import StatusBadge from '../../../../components/common/StatusBadge';
import EmptyState from '../../../../components/common/EmptyState';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { Package } from 'lucide-react';

const ActivePackagesTab = ({ data, loading, onLoad }) => {
  useEffect(() => {
    onLoad('packages');
  }, [onLoad]);

  if (loading) return <LoadingSpinner />;
  if (!data?.packages?.length) return <EmptyState icon={Package} title="No packages" description="This user hasn't purchased any packages yet." />;

  const columns = [
    {
      key: 'packageId',
      label: 'Package',
      render: (val) => val?.name || 'N/A',
    },
    {
      key: 'purchaseAmount',
      label: 'Invested',
      render: (val) => <span className="font-mono">${val?.toLocaleString()}</span>,
    },
    {
      key: 'dailyROISnapshot',
      label: 'Daily ROI',
      render: (val) => <span className="font-mono">{val}%</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
    {
      key: 'isMining',
      label: 'Mining',
      render: (val) => (
        <span className={`text-xs font-medium ${val ? 'text-success' : 'text-text-secondary'}`}>
          {val ? 'Active' : 'Idle'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={data.packages} emptyTitle="No packages" />
      <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={(p) => onLoad('packages', p)} />
    </div>
  );
};

export default ActivePackagesTab;
