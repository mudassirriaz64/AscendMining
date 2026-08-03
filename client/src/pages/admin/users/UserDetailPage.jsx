import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Mail, Phone, Calendar, Ban, RotateCcw, KeyRound, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchUserDetail, fetchUserPackages, fetchUserDeposits,
  fetchUserWithdrawals, fetchUserScreenshots,
  suspendUser, reactivateUser, triggerPasswordReset,
  clearActionSuccess, clearAdminError, resetUserDetail, adjustUserBalance,
} from '../../../store/slices/adminUserSlice';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Tabs from '../../../components/common/Tabs';
import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ActivePackagesTab from './tabs/ActivePackagesTab';
import DepositHistoryTab from './tabs/DepositHistoryTab';
import WithdrawalHistoryTab from './tabs/WithdrawalHistoryTab';
import PaymentScreenshotsTab from './tabs/PaymentScreenshotsTab';
import KYCHistoryTab from './tabs/KYCHistoryTab';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    userDetail, loading, error, actionSuccess,
    userPackages, userDeposits, userWithdrawals, userScreenshots, tabLoading,
  } = useSelector((s) => s.adminUsers);

  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [resetModal, setResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [balanceModal, setBalanceModal] = useState(false);
  const [adjustType, setAdjustType] = useState('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    dispatch(fetchUserDetail(id));
    return () => dispatch(resetUserDetail());
  }, [dispatch, id]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearActionSuccess());
      dispatch(fetchUserDetail(id));
    }
  }, [actionSuccess, dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminError());
    }
  }, [error, dispatch]);

  const loadTab = useCallback((tabKey) => {
    const params = { id, params: { page: 1, limit: 20 } };
    switch (tabKey) {
      case 'packages': dispatch(fetchUserPackages(params)); break;
      case 'deposits': dispatch(fetchUserDeposits(params)); break;
      case 'withdrawals': dispatch(fetchUserWithdrawals(params)); break;
      case 'screenshots': dispatch(fetchUserScreenshots(params)); break;
      default: break;
    }
  }, [dispatch, id]);

  const handleSuspend = () => {
    if (!suspendReason.trim()) return;
    dispatch(suspendUser({ id, reason: suspendReason }));
    setSuspendModal(false);
    setSuspendReason('');
  };

  const handleReactivate = () => {
    dispatch(reactivateUser(id));
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    dispatch(triggerPasswordReset({ id, newPassword }));
    setResetModal(false);
    setNewPassword('');
  };

  const handleAdjustBalance = () => {
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    dispatch(adjustUserBalance({
      id,
      type: adjustType,
      amount: parseFloat(adjustAmount),
      reason: adjustReason.trim()
    }));
    setBalanceModal(false);
    setAdjustAmount('');
    setAdjustReason('');
  };

  if (loading && !userDetail) return <LoadingSpinner />;
  if (!userDetail) return null;

  const tabs = [
    {
      key: 'packages',
      label: 'Active Packages',
      content: <ActivePackagesTab data={userPackages} loading={tabLoading} onLoad={loadTab} />,
    },
    {
      key: 'deposits',
      label: 'Deposit History',
      content: <DepositHistoryTab data={userDeposits} loading={tabLoading} onLoad={loadTab} />,
    },
    {
      key: 'withdrawals',
      label: 'Withdrawal History',
      content: <WithdrawalHistoryTab data={userWithdrawals} loading={tabLoading} onLoad={loadTab} />,
    },
    {
      key: 'screenshots',
      label: 'Payment Screenshots',
      content: <PaymentScreenshotsTab data={userScreenshots} loading={tabLoading} onLoad={loadTab} />,
    },
    {
      key: 'kyc',
      label: 'KYC History',
      content: <KYCHistoryTab userDetail={userDetail} />,
    },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 cursor-pointer transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      <div className="bg-[#0d1420]/60 backdrop-blur-xl border border-white/10 rounded-2xl mb-6 shadow-xl text-white">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Column 1: Profile Core */}
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-xl font-bold shrink-0 shadow-inner">
                  {userDetail.fullName?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">{userDetail.fullName}</h1>
                  <p className="text-xs text-slate-400">@{userDetail.username}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={userDetail.status} />
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-400 pt-2">
                <div className="flex items-center gap-2"><Mail size={14} className="text-slate-500" /> {userDetail.email}</div>
                {userDetail.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500" /> {userDetail.phone}</div>}
                <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-500" /> Joined {new Date(userDetail.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Column 2: Balance Ledger */}
            <div className="space-y-4 py-6 lg:py-0 lg:px-6 flex flex-col justify-center">
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Wallet Balance</p>
                <p className="text-3xl font-mono font-bold text-amber-400">
                  ${(userDetail.walletBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Total Deposits</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ${(userDetail.totalDeposits || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Total Payouts</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ${(userDetail.totalPayouts || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Action Console */}
            <div className="space-y-3 py-6 lg:py-0 lg:pl-6 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Action Console</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userDetail.status === 'suspended' ? (
                  <Button variant="primary" size="sm" onClick={handleReactivate} className="w-full">
                    <RotateCcw size={14} className="mr-1.5" /> Activate
                  </Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setSuspendModal(true)} className="w-full">
                    <Ban size={14} className="mr-1.5" /> Suspend
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setResetModal(true); setNewPassword(''); }} className="w-full">
                  <KeyRound size={14} className="mr-1.5" /> Reset Pass
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBalanceModal(true)} className="w-full sm:col-span-2">
                  <DollarSign size={14} className="mr-1.5" /> Adjust Balance
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0d1420]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <Tabs tabs={tabs} defaultTab="packages" />
      </div>

      <Modal isOpen={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This will immediately block <strong>{userDetail.username}</strong> from logging in and performing any actions.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reason (required)</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-danger focus:ring-1 focus:ring-danger/30 focus:bg-white/10 transition"
              rows={3}
              placeholder="Enter reason for suspension..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSuspendModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSuspend} disabled={!suspendReason.trim()}>
              Suspend User
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Set a new password directly for <strong>{userDetail.username}</strong> ({userDetail.email}).
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">New Password (min 6 chars)*</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setResetModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6}>
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={balanceModal} onClose={() => setBalanceModal(false)} title="Adjust Wallet Balance" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Adjust the wallet balance of <strong>{userDetail.username}</strong>. Current balance: <strong>${(userDetail.walletBalance || 0).toFixed(2)}</strong>.
          </p>

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(0,230,153,0.15)] font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Add Funds
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    adjustType === 'deduct'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)] font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Deduct Funds
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Amount (USD)*</label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reason / Description</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition resize-none"
                rows={2}
                placeholder="Enter adjustment reason"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setBalanceModal(false)}>Cancel</Button>
            <Button
              variant={adjustType === 'add' ? 'primary' : 'danger'}
              onClick={handleAdjustBalance}
              disabled={!adjustAmount || parseFloat(adjustAmount) <= 0}
            >
              Confirm Adjustment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetailPage;
