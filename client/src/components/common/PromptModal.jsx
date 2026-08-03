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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0d1420]/90 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-3xl w-full max-w-sm mx-4 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_10px_rgba(255,184,0,0.1)]">
          <Edit3 size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-heading">{title}</h3>
          {message && <p className="text-sm text-slate-400 mt-1">{message}</p>}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition"
        />
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-white/10 text-slate-400 font-bold text-xs py-3 rounded-xl hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(value); onClose(); }}
            className="flex-1 bg-primary-container text-slate-950 font-semibold text-xs py-3 rounded-xl hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,184,0,0.35)] transition-all duration-300 uppercase tracking-wider cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
