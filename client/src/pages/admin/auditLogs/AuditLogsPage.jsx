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
        <div className="flex items-center gap-2 text-text-secondary py-4">
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
        <div className="flex flex-col gap-2 text-text-secondary py-4">
          <span className="text-sm">State recorded but no properties were modified.</span>
          <div className="bg-bg-light-alt/50 border border-border-light p-3 rounded-lg text-xs break-all max-h-40 overflow-y-auto">
            <span className="font-semibold block text-text-light-bg mb-1">State Payload:</span>
            {JSON.stringify(aObj || bObj, null, 2)}
          </div>
        </div>
      );
    }

    const formatVal = (v) => {
      if (v === null || v === undefined) return <span className="text-white/30 italic">null</span>;
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };

    return (
      <div className="border border-border-light rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 gap-4 bg-bg-light-alt px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-light">
          <div>Property</div>
          <div>Before</div>
          <div>After</div>
        </div>
        <div className="divide-y divide-border-light/40 max-h-96 overflow-y-auto">
          {changedKeys.map(key => (
            <div key={key} className="grid grid-cols-3 gap-4 px-4 py-2.5 text-xs font-mono hover:bg-white/5 transition-colors items-center">
              <div className="text-primary font-semibold truncate" title={key}>{key}</div>
              <div className="text-error line-through break-all pr-2">{formatVal(bObj[key])}</div>
              <div className="text-success break-all">{formatVal(aObj[key])}</div>
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
      render: (val) => <span className="text-xs text-text-secondary font-mono">{formatDateTime(val)}</span>,
    },
    {
      key: 'actorId',
      label: 'Actor (Admin)',
      render: (val) => (
        <div>
          <span className="font-bold text-text-light-bg">{val?.fullName || 'System'}</span>
          <span className="block text-xxs text-text-secondary font-mono">{val?.email || ''}</span>
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
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs bg-bg-light-alt text-text-light-bg font-semibold uppercase">
            {log.targetType}
          </span>
          <span className="block text-xxs text-text-secondary font-mono truncate max-w-xs" title={log.targetId}>
            {log.targetName || `ID: ${log.targetId}`}
          </span>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val || 'N/A'}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, log) => (
        <button
          onClick={() => handleOpenDetails(log)}
          className="p-1.5 bg-bg-light-alt hover:bg-white/10 rounded-lg cursor-pointer transition-colors text-text-secondary hover:text-text-light-bg flex items-center gap-1"
          title="Inspect States"
        >
          <Eye size={14} />
          <span className="text-xxs font-medium">Inspect</span>
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
    'referral_blocked',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-light-bg flex items-center gap-3">
            <History size={26} className="text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm text-text-secondary mt-1">
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
      <div className="bg-bg-card border border-border-light/60 p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-text-secondary" size={18} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search IP, Actor or Target ID..."
            className="w-full pl-10 pr-4 py-2 bg-bg-light-alt border border-border-light rounded-lg text-sm text-text-light-bg placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs text-text-secondary uppercase font-semibold whitespace-nowrap">Filter Action:</label>
          <select
            value={actionFilter}
            onChange={handleFilterChange}
            className="w-full md:w-56 px-3 py-2 bg-bg-light-alt border border-border-light rounded-lg text-sm text-text-light-bg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          >
            <option value="all">All Actions</option>
            {actionEnumList.map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-bg-card border border-border-light/60 rounded-xl shadow-lg overflow-hidden p-6">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyTitle="No Audit Logs Found"
          emptyDescription="Try broadening your search or selection filters."
        />
        
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Details Diff Inspector Modal */}
      {modalOpen && selectedLog && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="State Diff Inspector"
          size="lg"
        >
          <div className="space-y-4">
            {/* Log Metadata Cards */}
            <div className="grid grid-cols-2 gap-4 bg-bg-light-alt/50 border border-border-light p-4 rounded-lg text-sm">
              <div>
                <p className="text-text-secondary text-xs uppercase font-semibold">Action Triggered</p>
                <div className="mt-1">{renderActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase font-semibold">Administrator</p>
                <p className="font-bold text-text-light-bg mt-1">
                  {selectedLog.actorId?.fullName || 'System'} 
                  <span className="font-mono font-normal text-xs text-text-secondary ml-1">
                    ({selectedLog.actorId?.email || 'system@ascendmining.com'})
                  </span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-text-secondary text-xs uppercase font-semibold">Target Resource</p>
                <p className="text-text-light-bg font-semibold mt-1">
                  {selectedLog.targetType} 
                  <span className="font-mono font-normal text-xs text-text-secondary ml-1">
                    {selectedLog.targetName ? `${selectedLog.targetName} (${selectedLog.targetId})` : selectedLog.targetId}
                  </span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-text-secondary text-xs uppercase font-semibold">Metadata</p>
                <p className="text-text-light-bg font-mono text-xs mt-1">
                  IP: {selectedLog.ipAddress || 'N/A'} | Date: {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
            </div>

            {/* State Comparison Header */}
            <div>
              <h4 className="text-sm font-extrabold text-text-light-bg mb-2 uppercase tracking-wide">
                Property State Differences
              </h4>
              {renderDiff(selectedLog.beforeState, selectedLog.afterState)}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Close Inspector</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogsPage;
