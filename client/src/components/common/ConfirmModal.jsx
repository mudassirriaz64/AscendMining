import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    buttonBg: 'bg-danger text-white hover:bg-danger/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    buttonBg: 'bg-primary-container text-slate-950 hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,184,0,0.35)] font-semibold',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    buttonBg: 'bg-primary-container text-slate-950 hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,184,0,0.35)] font-semibold',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    buttonBg: 'bg-primary-container text-slate-950 hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,184,0,0.35)] font-semibold',
  },
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', children }) => {
  const v = variantStyles[variant] || variantStyles.danger;
  const Icon = v.icon;

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0d1420]/90 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-3xl w-full max-w-sm mx-4 p-6 text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${v.iconBg} border border-white/5`}>
          <Icon size={24} className={v.iconColor} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-heading">{title}</h3>
          {message && <p className="text-sm text-slate-400 mt-1">{message}</p>}
        </div>
        {children}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-white/10 text-slate-400 font-bold text-xs py-3 rounded-xl hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wider cursor-pointer ${v.buttonBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
