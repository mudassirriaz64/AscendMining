import { useEffect } from 'react';
import DataTable from '../../../../components/common/DataTable';
import Pagination from '../../../../components/common/Pagination';
import StatusBadge from '../../../../components/common/StatusBadge';
import EmptyState from '../../../../components/common/EmptyState';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { Users } from 'lucide-react';

const ReferralHistoryTab = ({ data, loading, onLoad }) => {
  useEffect(() => {
    onLoad('referrals');
  }, [onLoad]);

  if (loading) return <LoadingSpinner />;
  if (!data?.referrals?.length) return <EmptyState icon={Users} title="No referrals" description="This user hasn't referred anyone yet." />;

  const columns = [
    {
      key: 'referredUser',
      label: 'Referred User',
      render: (val) => (
        <div>
          <p className="font-medium text-text-light-bg">{val?.fullName || 'N/A'}</p>
          <p className="text-xs text-text-secondary">@{val?.username}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'bonus',
      label: 'Bonus',
      render: (val) => <span className="font-mono">${(val || 0).toLocaleString()}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={data.referrals} emptyTitle="No referrals" />
      <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={(p) => onLoad('referrals', p)} />
    </div>
  );
};

export default ReferralHistoryTab;
