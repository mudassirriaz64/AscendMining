import { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const InputField = forwardRef(({ label, error, success, icon: Icon, className = '', type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] text-slate-400 mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm text-white bg-white/5 placeholder-white/30 placeholder:text-white/30 outline-none transition-all duration-150
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : success ? 'pr-10' : ''}
            ${error ? 'border-error focus:border-error focus:ring-1 focus:ring-error/30' : ''}
            ${success ? 'border-success focus:border-success focus:ring-1 focus:ring-success/30' : ''}
            ${!error && !success ? 'border-white/10 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10' : ''}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none cursor-pointer flex items-center justify-center"
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
        <p id={`${props.name}-error`} className="mt-1.5 text-xs text-error flex items-center gap-1" role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
