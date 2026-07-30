import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-3 bg-error-container text-on-error-container border border-error/20 rounded-lg text-sm ${className}`} role="alert">
      <AlertCircle size={18} className="shrink-0 text-error" />
      <span>{typeof message === 'string' ? message : message.error?.message || 'An error occurred.'}</span>
    </div>
  );
};

export default ErrorMessage;
