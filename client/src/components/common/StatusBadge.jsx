import { memo } from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    active: 'bg-success/10 text-success border-success/20',
    suspended: 'bg-danger/10 text-danger border-danger/20',
    unverified: 'bg-warning/10 text-warning border-warning/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-danger/10 text-danger border-danger/20',
    completed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-danger/10 text-danger border-danger/20',
    qualified: 'bg-success/10 text-success border-success/20',
    blocked: 'bg-danger/10 text-danger border-danger/20',
    open: 'bg-secondary/10 text-secondary border-secondary/20',
    new: 'bg-secondary/10 text-secondary border-secondary/20',
    read: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
  };

  const label = status?.charAt(0).toUpperCase() + status?.slice(1);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[status] || 'bg-bg-light-alt text-text-secondary border-border-light'}`}>
      {label}
    </span>
  );
};

export default memo(StatusBadge);
