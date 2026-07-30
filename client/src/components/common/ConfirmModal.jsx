import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    buttonBg: 'bg-error hover:brightness-110',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    buttonBg: 'bg-amber-500 hover:brightness-110',
  },
  info: {
    icon: Info,
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-primary',
    buttonBg: 'bg-primary-container hover:brightness-110 text-on-primary-fixed',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    buttonBg: 'bg-primary-container hover:brightness-110 text-on-primary-fixed',
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-outline-variant w-full max-w-sm mx-4 p-6 text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${v.iconBg}`}>
          <Icon size={24} className={v.iconColor} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface font-heading">{title}</h3>
          {message && <p className="text-sm text-on-surface-variant mt-1">{message}</p>}
        </div>
        {children}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-outline-variant text-on-surface-variant font-bold text-xs py-3 rounded-lg hover:bg-surface-container-low transition-colors uppercase tracking-wider cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 text-white font-bold text-xs py-3 rounded-lg transition-all uppercase tracking-wider cursor-pointer ${v.buttonBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
