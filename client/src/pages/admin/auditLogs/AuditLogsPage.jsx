import { useState, useEffect, useCallback } from 'react';
import { History, Eye, Search, AlertCircle, RefreshCw } from 'lucide-react';
import adminService from '../../../services/adminService';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        search: search.trim() || undefined,
      };
      const response = await adminService.getAuditLogs(params);
      if (response.data?.success) {
        setLogs(response.data.data.logs || []);
        setTotal(response.data.data.pagination?.total || 0);
      } else {
        toast.error('Failed to load audit logs.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || 'Error fetching audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleFilterChange = (e) => {
    setActionFilter(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  // Helper to format timestamps nicely
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  // Action badge renderer
  const renderActionBadge = (action) => {
    let badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    
    if (action.includes('approved') || action.includes('reactivated') || action.includes('created')) {
      badgeClass = 'bg-success/10 text-success border border-success/20';
    } else if (action.includes('rejected') || action.includes('suspended') || action.includes('cancelled') || action.includes('deleted') || action.includes('blocked')) {
      badgeClass = 'bg-error/10 text-error border border-error/20';
    } else if (action.includes('updated') || action.includes('adjustment') || action.includes('reset')) {
      badgeClass = 'bg-warning/10 text-warning border border-warning/20';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium capitalize ${badgeClass}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const renderDiff = (before, after) => {
    if (!before && !after) {
      return (
        <div className="flex items-center gap-2 text-slate-400 py-4 font-mono">
          <AlertCircle size={16} />
          <span>No state details recorded for this action.</span>
        </div>
      );
    }

    const parseObj = (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };

    const bObj = parseObj(before) || {};
    const aObj = parseObj(after) || {};

    // Get union of all changed/present keys
    const allKeys = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));

    // Filter to keys that actually changed value
    const changedKeys = allKeys.filter(key => {
      // Exclude generic mongoose properties if they confuse diffs
      if (['updatedAt', '__v'].includes(key)) return false;
      return JSON.stringify(bObj[key]) !== JSON.stringify(aObj[key]);
    });

    if (changedKeys.length === 0) {
      return (
        <div className="flex flex-col gap-2 text-slate-400 py-4 font-mono">
          <span className="text-sm">State recorded but no properties were modified.</span>
          <div className="bg-[#050811] border border-white/5 p-3 rounded-xl text-xs break-all max-h-40 overflow-y-auto text-slate-300">
            <span className="font-semibold block text-slate-400 mb-1">State Payload:</span>
            {JSON.stringify(aObj || bObj, null, 2)}
          </div>
        </div>
      );
    }

    const formatVal = (v) => {
      if (v === null || v === undefined) return 'null';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };

    return (
      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#050811] shadow-inner font-mono text-xs text-slate-350">
        <div className="grid grid-cols-3 gap-4 bg-white/[0.02] px-4 py-3 font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
          <div>Property</div>
          <div>Before (Deleted)</div>
          <div>After (Added)</div>
        </div>
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
          {changedKeys.map(key => (
            <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-white/[0.01] transition-colors items-start">
              <div className="text-amber-400 font-semibold truncate pt-1" title={key}>{key}</div>
              <div className="text-red-400 bg-red-950/15 px-2 py-1.5 rounded-lg border border-red-500/20 break-all shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                - {formatVal(bObj[key])}
              </div>
              <div className="text-emerald-400 bg-emerald-950/15 px-2 py-1.5 rounded-lg border border-emerald-500/20 break-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                + {formatVal(aObj[key])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (val) => <span className="text-xs text-slate-400 font-mono">{formatDateTime(val)}</span>,
    },
    {
      key: 'actorId',
      label: 'Actor (Admin)',
      render: (val) => (
        <div>
          <span className="font-semibold text-slate-200">{val?.fullName || 'System'}</span>
          <span className="block text-xxs text-slate-400 font-mono mt-0.5">{val?.email || ''}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (val) => renderActionBadge(val),
    },
    {
      key: 'targetType',
      label: 'Target Resource',
      render: (_, log) => (
        <div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs bg-white/5 text-slate-300 border border-white/10 font-mono font-bold uppercase">
            {log.targetType}
          </span>
          <span className="block text-xxs text-slate-400 font-mono truncate max-w-xs mt-1" title={log.targetId}>
            {log.targetName || `ID: ${log.targetId}`}
          </span>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (val) => <span className="font-mono text-xs text-slate-450">{val || 'N/A'}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, log) => (
        <button
          onClick={() => handleOpenDetails(log)}
          className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer transition-all text-slate-400 hover:text-white flex items-center gap-1.5 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]"
          title="Inspect States"
        >
          <Eye size={12} />
          <span className="text-xxs font-bold">Inspect</span>
        </button>
      ),
    },
  ];

  const actionEnumList = [
    'deposit_approved',
    'deposit_rejected',
    'withdrawal_approved',
    'withdrawal_rejected',
    'user_suspended',
    'user_reactivated',
    'password_reset_triggered',
    'package_created',
    'package_updated',
    'package_cancelled',
    'package_deleted',
    'wallet_adjustment',
    'cms_content_updated',
    'coin_created',
    'coin_updated',
    'coin_deleted',
    'faq_created',
    'faq_updated',
    'faq_deleted',
    'service_created',
    'service_updated',
    'service_deleted',
  ];

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-3">
            <History size={24} className="text-amber-400" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and inspect all actions taken by administrators and support agents.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 cursor-pointer text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d1420]/45 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between text-white">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-white/30" size={16} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search IP, Actor or Target ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <label className="text-xs text-slate-400 uppercase font-semibold whitespace-nowrap">Filter Action:</label>
          <select
            value={actionFilter}
            onChange={handleFilterChange}
            className="w-full md:w-56 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-[#0d1420] transition"
          >
            <option value="all" className="bg-[#0d1420] text-white">All Actions</option>
            {actionEnumList.map((act) => (
              <option key={act} value={act} className="bg-[#0d1420] text-white">
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0d1420]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden p-6 text-white">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyTitle="No Audit Logs Found"
          emptyDescription="Try broadening your search or selection filters."
        />
        
        <div className="pt-4">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      {modalOpen && selectedLog && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="State Diff Inspector"
          size="lg"
        >
          <div className="space-y-4 text-white">
            {/* Log Metadata Cards */}
            <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-xl text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">Action Triggered</p>
                <div className="mt-1">{renderActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">Administrator</p>
                <p className="font-bold text-white mt-1">
                  {selectedLog.actorId?.fullName || 'System'} 
                  <span className="font-mono font-normal text-xs text-slate-400 ml-1">
                    ({selectedLog.actorId?.email || 'system@ascendmining.com'})
                  </span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-slate-400 text-xs uppercase font-semibold">Target Resource</p>
                <p className="text-slate-200 font-semibold mt-1">
                  {selectedLog.targetType} 
                  <span className="font-mono font-normal text-xs text-slate-400 ml-1">
                    {selectedLog.targetName ? `${selectedLog.targetName} (${selectedLog.targetId})` : selectedLog.targetId}
                  </span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-slate-400 text-xs uppercase font-semibold">Metadata</p>
                <p className="text-slate-200 font-mono text-xs mt-1">
                  IP: {selectedLog.ipAddress || 'N/A'} | Date: {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
            </div>

            {/* State Comparison Header */}
            <div>
              <h4 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">
                Property State Differences
              </h4>
              {renderDiff(selectedLog.beforeState, selectedLog.afterState)}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Close Inspector</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogsPage;
