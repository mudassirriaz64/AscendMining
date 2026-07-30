import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Play, Pause, EyeOff, Clock, Edit2, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import { 
  fetchMiningSettings, updateMiningSettings, 
  fetchUserPackages, updateUserPackage, clearStatus 
} from '../../../store/slices/adminMiningSettingsSlice';
import PageSkeleton from '../../../components/common/PageSkeleton';
import InputField from '../../../components/common/InputField';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';

const MiningSettingsPage = () => {
  const dispatch = useDispatch();
  const { settings, userPackages, loading, error, success } = useSelector((state) => state.adminMiningSettings);

  const [timerDuration, setTimerDuration] = useState(24);
  const [systemState, setSystemState] = useState('active'); // active, paused, disabled

  // Active package editing modal state
  const [editingPkg, setEditingPkg] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRoi, setEditRoi] = useState(0);
  const [editDuration, setEditDuration] = useState(0);
  const [editStatus, setEditStatus] = useState('active');
  const [editNextMining, setEditNextMining] = useState('');

  useEffect(() => {
    dispatch(fetchMiningSettings());
    dispatch(fetchUserPackages());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setTimerDuration(settings.timerDuration || 24);
      if (settings.isDisabled) {
        setSystemState('disabled');
      } else if (settings.isPaused) {
        setSystemState('paused');
      } else {
        setSystemState('active');
      }
    }
  }, [settings]);

  useEffect(() => {
    if (success) {
      toast.success('Mining configuration updated successfully!');
      dispatch(clearStatus());
      setEditModalOpen(false);
    }
    if (error) {
      toast.error(error);
      dispatch(clearStatus());
    }
  }, [success, error, dispatch]);

  const handleSaveSettings = () => {
    dispatch(updateMiningSettings({
      timerDuration: parseInt(timerDuration),
      isPaused: systemState === 'paused',
      isDisabled: systemState === 'disabled',
    }));
  };

  const handleOpenEditPkg = (pkg) => {
    setEditingPkg(pkg);
    setEditRoi(pkg.dailyROISnapshot);
    setEditDuration(pkg.durationSnapshot);
    setEditStatus(pkg.status);
    if (pkg.nextMiningAt) {
      const date = new Date(pkg.nextMiningAt);
      // Format as YYYY-MM-DDTHH:MM
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      setEditNextMining(localDate.toISOString().slice(0, 16));
    } else {
      setEditNextMining('');
    }
    setEditModalOpen(true);
  };

  const handleSavePkgUpdate = () => {
    if (!editingPkg) return;
    dispatch(updateUserPackage({
      id: editingPkg._id,
      data: {
        dailyROISnapshot: parseFloat(editRoi),
        durationSnapshot: parseInt(editDuration),
        status: editStatus,
        nextMiningAt: editNextMining ? new Date(editNextMining).toISOString() : null,
      }
    }));
  };

  if (loading && !settings) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans antialiased text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mining Reward System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure global mining parameters, system states, and adjust active user packages.</p>
        </div>
      </div>

      {/* GLOBAL SYSTEM SETTINGS CARD */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={20} className="text-yellow-500" />
            Global Mining System Control
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">System Operations State</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSystemState('active')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    systemState === 'active'
                      ? 'border-green-500 bg-green-50/50 text-green-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <Play size={20} className="mb-1" />
                  <span className="text-xs font-bold">Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSystemState('paused')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    systemState === 'paused'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <Pause size={20} className="mb-1" />
                  <span className="text-xs font-bold">Paused</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSystemState('disabled')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    systemState === 'disabled'
                      ? 'border-red-500 bg-red-50/50 text-red-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <EyeOff size={20} className="mb-1" />
                  <span className="text-xs font-bold">Disabled</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {systemState === 'active' && 'Mining system operates normally. Users can view progress and claim rewards.'}
                {systemState === 'paused' && 'Freeze mining claims. Users can see their timer but cannot claim rewards.'}
                {systemState === 'disabled' && 'Hides the mining system entirely from the user dashboard.'}
              </p>
            </div>
            
            <InputField
              label="Global Timer Cooldown (Hours)*"
              type="number"
              min="1"
              value={timerDuration}
              onChange={(e) => setTimerDuration(e.target.value)}
              placeholder="e.g. 24"
            />
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              loading={loading}
            >
              Save Configuration
            </Button>
          </div>
        </div>

        <div className="bg-slate-50/60 p-8 flex flex-col justify-center space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Active Configuration Summary</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">System State</span>
                <span className={`font-bold capitalize ${
                  systemState === 'active' ? 'text-green-600' :
                  systemState === 'paused' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {systemState}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Timer Duration</span>
                <span className="font-bold text-slate-800">{timerDuration} Hours</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Active User Packages</span>
                <span className="font-bold text-slate-800">
                  {userPackages.filter(p => p.status === 'active').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER PACKAGES LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-950 uppercase tracking-tight">
            Active User <span className="text-yellow-500">Mining Packages</span>
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            {userPackages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No active packages in the system.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Invested</th>
                    <th className="px-6 py-4">Daily ROI</th>
                    <th className="px-6 py-4">Remaining Days</th>
                    <th className="px-6 py-4">Next Claim</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userPackages.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{pkg.userId?.fullName || 'N/A'}</p>
                        <p className="text-slate-400 text-[10px]">{pkg.userId?.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {pkg.packageId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-800 font-bold">
                        ${pkg.purchaseAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-green-600">
                        {pkg.dailyROISnapshot}%
                      </td>
                      <td className="px-6 py-4 text-slate-650">
                        {pkg.durationSnapshot} Days
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {pkg.nextMiningAt ? new Date(pkg.nextMiningAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pkg.status === 'active' ? 'bg-green-100 text-green-700' :
                          pkg.status === 'pending_deposit' ? 'bg-amber-100 text-amber-700' :
                          pkg.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditPkg(pkg)}
                          className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Edit ROI & Cooldown"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Adjust Package: ${editingPkg?.packageId?.name || 'User Plan'}`}
        size="md"
      >
        {editingPkg && (
          <div className="space-y-4 text-xs">
            <InputField
              label="Daily ROI Snapshot (%)*"
              type="number"
              step="0.01"
              value={editRoi}
              onChange={(e) => setEditRoi(e.target.value)}
            />
            <InputField
              label="Remaining Duration (Days)*"
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
            />
            <div>
              <label className="block text-slate-500 mb-1 font-bold">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs outline-none focus:border-primary"
              >
                <option value="pending_deposit">Pending Deposit</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <InputField
              label="Next Payout Date & Time"
              type="datetime-local"
              value={editNextMining}
              onChange={(e) => setEditNextMining(e.target.value)}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePkgUpdate}
                loading={loading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MiningSettingsPage;
