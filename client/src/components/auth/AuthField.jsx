import { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const AuthField = forwardRef(({ label, error, success, icon: Icon, className = '', type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-page-text-soft mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/80 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full px-4 py-3 rounded-xl text-sm text-page-text bg-page-input border placeholder:text-page-text-faint outline-none transition-all duration-150
            ${Icon ? 'pl-10' : ''}
            ${isPassword || success ? 'pr-10' : ''}
            ${
              error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40'
                : success
                ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                : 'border-page-input-border focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
            }
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-page-text-faint hover:text-page-text focus:outline-none cursor-pointer flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : (
          success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
              <CheckCircle size={18} />
            </div>
          )
        )}
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

AuthField.displayName = 'AuthField';

export default AuthField;
