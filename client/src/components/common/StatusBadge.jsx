import { memo } from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,230,153,0.2)]',
    suspended: 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    unverified: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(255,184,0,0.2)]',
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(255,184,0,0.2)]',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,230,153,0.2)]',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,230,153,0.2)]',
    cancelled: 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    qualified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,230,153,0.2)]',
    blocked: 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    open: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    new: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    read: 'bg-white/5 text-slate-400 border border-white/10 shadow-none',
  };

  const label = status?.charAt(0).toUpperCase() + status?.slice(1);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${config[status] || 'bg-white/5 text-slate-400 border-white/10'}`}>
      {label}
    </span>
  );
};

export default memo(StatusBadge);
