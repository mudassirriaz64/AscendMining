import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

const SelectField = forwardRef(({ label, error, options = [], placeholder, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-text-secondary mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm text-text-light-bg bg-white appearance-none outline-none transition-all duration-150 pr-10
            ${error ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20' : 'border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20'}
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
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p id={`${props.name}-error`} className="mt-1.5 text-xs text-danger flex items-center gap-1" role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
