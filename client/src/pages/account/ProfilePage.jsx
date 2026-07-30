import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { User as UserIcon } from 'lucide-react';
import { updateProfile } from '../../store/slices/authSlice';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import Logo from '../../components/common/Logo';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    country: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (!user && loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      <Header />
      
      <main className="max-w-2xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        {/* PAGE HEADER */}
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase flex items-center gap-2">
            <UserIcon className="text-tertiary w-6 h-6" />
            Profile Settings
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-heading font-medium">Update your personal information</p>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white rounded-xl border border-outline-variant p-card-padding">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold text-on-surface-variant cursor-not-allowed opacity-60"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold text-on-surface-variant cursor-not-allowed opacity-60"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-on-secondary-fixed text-white/50 py-8 border-t border-outline-variant/20 mt-12">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-4">
          <Logo variant="dark" size="sm" className="h-8 opacity-80" />
          <p className="font-body-sm text-body-sm text-center">
            &copy; 2026 <span className="font-semibold text-white">AscendHash</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
