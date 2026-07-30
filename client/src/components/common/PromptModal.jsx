import { useEffect, useState } from 'react';
import { Edit3, X } from 'lucide-react';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, placeholder = '', initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

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
        <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mx-auto">
          <Edit3 size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface font-heading">{title}</h3>
          {message && <p className="text-sm text-on-surface-variant mt-1">{message}</p>}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-outline-variant text-on-surface-variant font-bold text-xs py-3 rounded-lg hover:bg-surface-container-low transition-colors uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(value); onClose(); }}
            className="flex-1 bg-primary-container text-on-primary-fixed font-bold text-xs py-3 rounded-lg hover:brightness-110 transition-all uppercase tracking-wider cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
