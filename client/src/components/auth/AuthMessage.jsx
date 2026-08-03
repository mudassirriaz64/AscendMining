import { AlertCircle } from 'lucide-react';

const AuthMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-sm ${className}`}
      role="alert"
    >
      <AlertCircle size={18} className="shrink-0 text-red-400" />
      <span>{typeof message === 'string' ? message : message.error?.message || 'An error occurred.'}</span>
    </div>
  );
};

export default AuthMessage;
