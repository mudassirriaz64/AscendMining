import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Mail, Phone, Calendar, Users, Ban, RotateCcw, KeyRound, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchUserDetail, fetchUserPackages, fetchUserDeposits,
  fetchUserWithdrawals, fetchUserReferrals, fetchUserScreenshots,
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
import ReferralHistoryTab from './tabs/ReferralHistoryTab';
import PaymentScreenshotsTab from './tabs/PaymentScreenshotsTab';
import KYCHistoryTab from './tabs/KYCHistoryTab';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    userDetail, loading, error, actionSuccess,
    userPackages, userDeposits, userWithdrawals, userReferrals, userScreenshots, tabLoading,
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
      case 'referrals': dispatch(fetchUserReferrals(params)); break;
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
      key: 'referrals',
      label: 'Referral History',
      content: <ReferralHistoryTab data={userReferrals} loading={tabLoading} onLoad={loadTab} />,
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
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-light-bg mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      <div className="bg-white rounded-xl border border-border-light mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold shrink-0">
                {userDetail.fullName?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-heading font-semibold text-text-light-bg">{userDetail.fullName}</h1>
                  <StatusBadge status={userDetail.status} />
                </div>
                <p className="text-sm text-text-secondary mb-2">@{userDetail.username}</p>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1"><Mail size={14} /> {userDetail.email}</span>
                  {userDetail.phone && <span className="flex items-center gap-1"><Phone size={14} /> {userDetail.phone}</span>}
                  <span className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(userDetail.createdAt).toLocaleDateString()}</span>
                  {userDetail.referredBy && <span className="flex items-center gap-1"><Users size={14} /> Referred by someone</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <p className="text-xs text-text-secondary">Wallet Balance</p>
                <p className="text-lg font-mono font-semibold text-text-light-bg">
                  ${(userDetail.walletBalance || 0).toLocaleString()}
                </p>
              </div>
              {userDetail.status === 'suspended' ? (
                <Button variant="primary" size="sm" onClick={handleReactivate}>
                  <RotateCcw size={14} className="mr-1" /> Activate
                </Button>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setSuspendModal(true)}>
                  <Ban size={14} className="mr-1" /> Suspend
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setResetModal(true); setNewPassword(''); }}>
                <KeyRound size={14} className="mr-1" /> Reset Password
              </Button>
              <Button variant="outline" size="sm" onClick={() => setBalanceModal(true)}>
                <DollarSign size={14} className="mr-1" /> Adjust Balance
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-light">
        <Tabs tabs={tabs} defaultTab="packages" />
      </div>

      <Modal isOpen={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will immediately block <strong>{userDetail.username}</strong> from logging in and performing any actions.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-light-bg mb-1">Reason (required)</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm outline-none focus:border-danger focus:ring-2 focus:ring-danger/20"
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
          <p className="text-sm text-text-secondary">
            Set a new password directly for <strong>{userDetail.username}</strong> ({userDetail.email}).
          </p>
          <div>
            <label className="block text-xs font-semibold text-text-light-bg mb-1">New Password (min 6 chars)*</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-text-light-bg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
            <Button variant="secondary" onClick={() => setResetModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6}>
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={balanceModal} onClose={() => setBalanceModal(false)} title="Adjust Wallet Balance" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Adjust the wallet balance of <strong>{userDetail.username}</strong>. Current balance: <strong>${(userDetail.walletBalance || 0).toFixed(2)}</strong>.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-light-bg mb-1">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-green-500 border-green-500 text-white font-bold'
                      : 'bg-white border-border-light text-slate-655 hover:bg-slate-50'
                  }`}
                >
                  Add Funds
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    adjustType === 'deduct'
                      ? 'bg-red-500 border-red-500 text-white font-bold'
                      : 'bg-white border-border-light text-slate-655 hover:bg-slate-50'
                  }`}
                >
                  Deduct Funds
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-light-bg mb-1">Amount (USD)*</label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-light-bg mb-1">Reason / Description</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={2}
                placeholder="e.g. Manual promotion bonus or corrected error"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
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
