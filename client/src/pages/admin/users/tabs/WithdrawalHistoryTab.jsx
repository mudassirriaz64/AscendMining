import { useEffect } from 'react';
import DataTable from '../../../../components/common/DataTable';
import Pagination from '../../../../components/common/Pagination';
import StatusBadge from '../../../../components/common/StatusBadge';
import EmptyState from '../../../../components/common/EmptyState';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { ArrowUpFromLine } from 'lucide-react';
import WalletAddressCell from '../../../../components/common/WalletAddressCell';

const WithdrawalHistoryTab = ({ data, loading, onLoad }) => {
  useEffect(() => {
    onLoad('withdrawals');
  }, [onLoad]);

  if (loading) return <LoadingSpinner />;
  if (!data?.withdrawals?.length) return <EmptyState icon={ArrowUpFromLine} title="No withdrawals" description="This user hasn't made any withdrawal requests yet." />;

  const columns = [
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => <span className="font-mono font-medium">${val?.toLocaleString()}</span>,
    },
    {
      key: 'walletAddress',
      label: 'Destination',
      render: (_, row) => <WalletAddressCell address={row.walletAddress} maxWidth="120px" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'requestedAt',
      label: 'Requested',
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
      <DataTable columns={columns} data={data.withdrawals} emptyTitle="No withdrawals" />
      <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={(p) => onLoad('withdrawals', p)} />
    </div>
  );
};

export default WithdrawalHistoryTab;
