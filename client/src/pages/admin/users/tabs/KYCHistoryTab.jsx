import { ShieldCheck, ShieldAlert, Clock, ShieldX, ExternalLink, User, Hash, MapPin, Calendar } from 'lucide-react';
import StatusBadge from '../../../../components/common/StatusBadge';
import EmptyState from '../../../../components/common/EmptyState';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-[#185adb]" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const statusConfig = {
  none:     { icon: ShieldX,     color: 'text-slate-400', bg: 'bg-slate-50',  label: 'Not Submitted' },
  pending:  { icon: Clock,       color: 'text-amber-600', bg: 'bg-amber-50',  label: 'Pending Review' },
  approved: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50',  label: 'Approved' },
  rejected: { icon: ShieldAlert, color: 'text-red-600',   bg: 'bg-red-50',    label: 'Rejected' },
};

const KYCHistoryTab = ({ userDetail }) => {
  const status   = userDetail?.kycStatus || 'none';
  const info     = userDetail?.kycPersonalInfo;
  const docType  = userDetail?.kycDocumentType;
  const docUrl   = userDetail?.kycDocumentUrl;
  const reason   = userDetail?.kycRejectionReason;

  const cfg = statusConfig[status] || statusConfig.none;
  const Icon = cfg.icon;

  const docTypeLabel = {
    cnic:           'National ID / CNIC',
    driver_license: 'Driver License',
    passport:       'Passport',
  }[docType] || docType;

  if (status === 'none') {
    return (
      <EmptyState
        icon={ShieldX}
        title="No KYC Submitted"
        description="This user has not submitted any KYC documents yet."
      />
    );
  }

  return (
    <div className="space-y-5 p-1">

      {/* Status Banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg}`}>
        <Icon size={22} className={cfg.color} />
        <div>
          <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
          {status === 'rejected' && reason && (
            <p className="text-xs text-red-500 mt-0.5">Reason: {reason}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Personal Info */}
        {info && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Personal Information</p>
            <InfoRow icon={User}     label="Full Name"       value={info.fullName} />
            <InfoRow icon={Calendar} label="Date of Birth"   value={info.dateOfBirth} />
            <InfoRow icon={Hash}     label="Document Number" value={info.documentNumber} />
            <InfoRow icon={MapPin}   label="City"            value={info.city} />
            <InfoRow icon={MapPin}   label="Address"         value={info.address} />
          </div>
        )}

        {/* Document Info */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document</p>

          {docType && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Document Type</p>
              <p className="font-semibold text-slate-800 mt-0.5">{docTypeLabel}</p>
            </div>
          )}

          {docUrl ? (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Uploaded Image</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-64">
                <img src={docUrl} alt="KYC Document" className="object-contain max-h-64 w-full" />
              </div>
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#185adb] font-semibold hover:underline mt-1"
              >
                <ExternalLink size={12} />
                Open Full Image
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No document image uploaded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCHistoryTab;
