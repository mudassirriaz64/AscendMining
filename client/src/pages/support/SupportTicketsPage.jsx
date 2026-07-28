import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ticket, Plus, X, Clock, CheckCircle2, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import { fetchMyTickets, createTicket } from '../../store/slices/supportChatSlice';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: X },
};

const SupportTicketsPage = () => {
  const dispatch = useDispatch();
  const { tickets, ticketsMeta, loading } = useSelector((s) => s.supportChat);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchMyTickets({}));
  }, [dispatch]);

  const handleFilterChange = (status) => {
    setActiveFilter(status);
    dispatch(fetchMyTickets({ status: status === 'all' ? undefined : status }));
  };

  const handleCreate = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject for your ticket.');
      return;
    }
    setCreating(true);
    try {
      await dispatch(createTicket({ subject: subject.trim() })).unwrap();
      toast.success('Support ticket created successfully!');
      setShowCreateModal(false);
      setSubject('');
    } catch (err) {
      toast.error(err || 'Failed to create ticket.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && tickets.length === 0) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#001f3f] flex items-center gap-2">
              <Ticket size={26} className="text-[#083358]" />
              Support Tickets
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {ticketsMeta.total} ticket{ticketsMeta.total !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#001f3f] to-[#083358] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md cursor-pointer"
          >
            <Plus size={16} />
            New Ticket
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                activeFilter === f
                  ? 'bg-[#001f3f] text-white border-[#001f3f]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Ticket size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold">No tickets found</p>
            <p className="text-slate-400 text-sm mt-1">Create a new ticket to get help from our team.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#001f3f] to-[#083358] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => {
              const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const Icon = cfg.icon;
              return (
                <div
                  key={ticket._id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ticket size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#001f3f] truncate">{ticket.subject}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created {formatDate(ticket.createdAt)}
                        {ticket.resolvedAt && ` · Resolved ${formatDate(ticket.resolvedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
                    <Icon size={12} />
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#001f3f]">Create Support Ticket</h2>
              <button
                onClick={() => { setShowCreateModal(false); setSubject(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#083358] focus:ring-2 focus:ring-[#083358]/15 transition-all placeholder-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <p className="text-xs text-slate-400">
                Our support team will review your ticket and respond as soon as possible.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setShowCreateModal(false); setSubject(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !subject.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#001f3f] to-[#083358] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {creating ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPage;
