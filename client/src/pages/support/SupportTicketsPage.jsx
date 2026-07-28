import { useCallback, useEffect, useState } from 'react';
import { Inbox, Ticket } from 'lucide-react';
import Header from '../../components/common/Header';
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
    <div className="min-h-screen bg-bg-light-alt">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-bg-dark"><Ticket size={20} /></span>
          <div><h1 className="text-2xl font-semibold text-text-light-bg">Support Tickets</h1><p className="mt-1 text-sm text-text-secondary">Escalations you created from live support.</p></div>
        </div>

        <div className="mb-4 flex border-b border-border-light" role="tablist" aria-label="Ticket filters">
          {[['all', 'All Tickets'], ['open', 'Open Tickets']].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === key ? 'border-primary text-text-light-bg' : 'border-transparent text-text-secondary hover:text-text-light-bg'}`}>{label}</button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-border-light">
          <DataTable columns={columns} data={tickets} loading={loading} emptyTitle="No support tickets" emptyDescription="If a live-chat response passes the SLA, you can create a ticket from the Talk to Agent panel." />
          {!loading && tickets.length === 0 ? <Inbox className="sr-only" /> : null}
        </div>
      </main>
    </div>
  );
};

export default SupportTicketsPage;
