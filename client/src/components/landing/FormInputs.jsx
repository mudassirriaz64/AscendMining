import { cn } from '../../utils/cn';

const baseFieldClass = cn(
  'w-full rounded-xl bg-white/[0.04] border border-border-glass px-4 py-3',
  'text-sm text-slate-100 placeholder:text-slate-500',
  'transition duration-300 outline-none',
  'focus:bg-white/[0.06] focus:border-electric-cyan/60 focus:ring-2 focus:ring-electric-cyan/40 focus:shadow-[0_0_20px_rgba(0,240,255,0.12)]',
  'hover:border-white/20'
);

export const TextField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  autoComplete,
  className,
}) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
        {label}
        {required ? <span className="text-gold ml-0.5">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(baseFieldClass, error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20')}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export const TextArea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  error,
  className,
}) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
        {label}
        {required ? <span className="text-gold ml-0.5">*</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(baseFieldClass, 'resize-none', error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20')}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
};
