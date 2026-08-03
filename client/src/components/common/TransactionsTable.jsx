import { Clock } from 'lucide-react';

const TransactionsTable = ({ transactions = [], loading = false }) => {
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="p-8 text-center text-on-surface-variant text-sm font-mono animate-pulse">
        Loading transactions...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-on-surface-variant text-sm">
        No transactions recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px] bg-transparent">
        <thead>
          <tr className="bg-page-fill text-page-text-muted border-b border-page-border">
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-page-text-muted uppercase">TRX ID</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-page-text-muted uppercase">TRANSACTED AT</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-page-text-muted uppercase">AMOUNT</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-page-text-muted uppercase">POST BALANCE</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-page-text-muted uppercase">DESCRIPTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-page-border-soft">
          {transactions.map((tx) => {
            const isCredit = tx.type === 'mining_payout' || tx.type === 'deposit' || tx.type === 'cancellation_refund';
            const isCoin = tx.type === 'mining_payout' || tx.type === 'withdrawal';
            const unit = isCoin ? (tx.coinSymbol || 'TX') : 'USD';

            return (
              <tr key={tx._id} className="border-b border-page-border-soft hover:bg-page-fill/50 transition-colors group">
                <td className="px-card-padding py-4 font-mono text-xs font-bold text-page-text">
                  {tx._id.slice(-12).toUpperCase()}
                </td>
                <td className="px-card-padding py-4">
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-page-text font-semibold">{formatDateTime(tx.createdAt)}</span>
                    <span className="text-[10px] text-page-text-muted uppercase mt-0.5">{formatRelativeTime(tx.createdAt)}</span>
                  </div>
                </td>
                <td className="px-card-padding py-4">
                  <span className={`font-mono text-xs px-2 py-1 rounded font-bold ${
                    isCredit ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
                  }`}>
                    {isCredit ? '+' : '-'}{tx.amount.toFixed(isCoin ? 4 : 2)} {unit}
                  </span>
                </td>
                <td className="px-card-padding py-4 font-mono text-xs text-page-text">
                  {tx.balanceAfter.toFixed(isCoin ? 4 : 2)} {unit}
                </td>
                <td className="px-card-padding py-4 font-body-md text-body-md text-page-text-muted italic">
                  {tx.reason || `${tx.type.replace('_', ' ')}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
