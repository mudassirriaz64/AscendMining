import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger ${className}`} role="alert">
      <AlertCircle size={18} className="shrink-0" />
      <span>{typeof message === 'string' ? message : message.error?.message || 'An error occurred.'}</span>
    </div>
  );
};

export default ErrorMessage;
