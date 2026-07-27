import { useEffect } from 'react';
import DataTable from '../../../../components/common/DataTable';
import Pagination from '../../../../components/common/Pagination';
import StatusBadge from '../../../../components/common/StatusBadge';
import EmptyState from '../../../../components/common/EmptyState';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { ArrowDownToLine } from 'lucide-react';

const DepositHistoryTab = ({ data, loading, onLoad }) => {
  useEffect(() => {
    onLoad('deposits');
  }, [onLoad]);

  if (loading) return <LoadingSpinner />;
  if (!data?.deposits?.length) return <EmptyState icon={ArrowDownToLine} title="No deposits" description="This user hasn't made any deposits yet." />;

  const columns = [
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => <span className="font-mono font-medium">${val?.toLocaleString()}</span>,
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (val) => val?.name || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'transactionReference',
      label: 'Reference',
      render: (val) => val || '—',
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      key: 'approvedAt',
      label: 'Approved',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={data.deposits} emptyTitle="No deposits" />
      <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={(p) => onLoad('deposits', p)} />
    </div>
  );
};

export default DepositHistoryTab;
