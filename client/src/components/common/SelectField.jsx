import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

const SelectField = forwardRef(({ label, error, options = [], placeholder, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-slate-400 mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm text-white bg-white/5 appearance-none outline-none transition-all duration-150 pr-10
            ${error ? 'border-error focus:border-error focus:ring-1 focus:ring-error/30' : 'border-white/10 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-[#0d1420]'}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.name}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[#0d1420] text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0d1420] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p id={`${props.name}-error`} className="mt-1.5 text-xs text-error flex items-center gap-1" role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
