import { Loader2 } from 'lucide-react';

const AuthButton = ({
  children,
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950
        hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:brightness-105
        transform active:scale-95
        ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AuthButton;
