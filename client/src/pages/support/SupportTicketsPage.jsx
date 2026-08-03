import { useCallback, useEffect, useState } from 'react';
import { Inbox, Ticket } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';

const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—';

const SupportTicketsPage = () => {
  const [tab, setTab] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selectedTab) => {
    setLoading(true);
    try {
      const query = selectedTab === 'open' ? '?status=open' : '';
      const response = await api.get(`/support/tickets${query}`);
      setTickets(response.data.data.tickets || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  const columns = [
    { key: 'subject', label: 'Subject', render: (value) => <span className="font-medium">{value}</span> },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
    { key: 'createdAt', label: 'Created', render: formatDate },
    { key: 'updatedAt', label: 'Last update', render: formatDate },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 flex-1 sm:px-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-on-surface-variant"><Ticket size={20} /></span>
        <div><h1 className="text-2xl font-semibold text-on-surface">Support Tickets</h1><p className="mt-1 text-sm text-on-surface-variant">Escalations you created from live support.</p></div>
      </div>

      <div className="mb-4 flex border-b border-outline-variant" role="tablist" aria-label="Ticket filters">
        {[['all', 'All Tickets'], ['open', 'Open Tickets']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === key ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>{label}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white/70 dark:bg-[#0d1420]/70 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-white/10">
        <DataTable columns={columns} data={tickets} loading={loading} emptyTitle="No support tickets" emptyDescription="If a live-chat response passes the SLA, you can create a ticket from the Talk to Agent panel." />
        {!loading && tickets.length === 0 ? <Inbox className="sr-only" /> : null}
      </div>
    </div>
  );
};

export default SupportTicketsPage;
