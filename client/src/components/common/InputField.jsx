import { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const InputField = forwardRef(({ label, error, success, icon: Icon, className = '', type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-text-secondary mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm text-text-light-bg bg-white placeholder:text-text-secondary/60 outline-none transition-all duration-150
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : success ? 'pr-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20' : ''}
            ${success ? 'border-success focus:border-success focus:ring-2 focus:ring-success/20' : ''}
            ${!error && !success ? 'border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.name}-error` : undefined}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-light-bg focus:outline-none cursor-pointer flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : (
          success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
              <CheckCircle size={18} />
            </div>
          )
        )}
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

InputField.displayName = 'InputField';

export default InputField;
