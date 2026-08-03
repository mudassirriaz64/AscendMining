import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { updatePassword } from '../../store/slices/authSlice';

const ChangePasswordPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      await dispatch(updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })).unwrap();
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-1 space-y-gutter">
        {/* PAGE HEADER */}
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase flex items-center gap-2">
            <Lock className="text-tertiary w-6 h-6" />
            Change Password
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-heading font-medium">Ensure your account is using a long, random password to stay secure.</p>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white dark:bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Current Password*</label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter current password"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-4 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer focus:outline-none"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">New Password*</label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-4 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer focus:outline-none"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Confirm New Password*</label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Re-type new password"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-4 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer focus:outline-none"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="text-error text-xs font-semibold">{error.message || 'An error occurred'}</div>}

            {/* BUTTONS */}
            <div className="pt-4 border-t border-outline-variant flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-container hover:brightness-110 text-on-primary-fixed font-extrabold text-xs shadow-sm px-6 py-2.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default ChangePasswordPage;
