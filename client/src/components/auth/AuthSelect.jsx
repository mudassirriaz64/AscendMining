import { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const AuthSelect = forwardRef(({ label, error, options = [], placeholder, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-page-text-soft mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl text-sm text-page-text bg-page-input border appearance-none outline-none transition-all duration-150 pr-10
            ${
              error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40'
                : 'border-page-input-border focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.name}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/80 pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p id={`${props.name}-error`} className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

AuthSelect.displayName = 'AuthSelect';

export default AuthSelect;
