import StatusBadge from '../../../../components/common/StatusBadge';

const ProfileTab = ({ user }) => {
  if (!user) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Personal Information</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary">Full Name</p>
            <p className="text-sm text-text-light-bg font-medium">{user.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Username</p>
            <p className="text-sm text-text-light-bg font-medium">@{user.username}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Email</p>
            <p className="text-sm text-text-light-bg font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Phone</p>
            <p className="text-sm text-text-light-bg font-medium">{user.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Account Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary">Status</p>
            <StatusBadge status={user.status} />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Role</p>
            <p className="text-sm text-text-light-bg font-medium capitalize">{user.role?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Wallet Balance</p>
            <p className="text-lg font-mono font-semibold text-text-light-bg">${(user.walletBalance || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Registered</p>
            <p className="text-sm text-text-light-bg font-medium">{new Date(user.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
