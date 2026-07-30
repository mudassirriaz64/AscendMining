import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-primary-container text-white hover:brightness-95 focus-visible:ring-primary-container/20 shadow-sm font-bold',
    secondary: 'border border-secondary text-secondary bg-transparent hover:bg-secondary/5 focus-visible:ring-secondary',
    danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
    ghost: 'text-text-secondary hover:bg-bg-light-alt focus-visible:ring-text-secondary',
    outline: 'border border-secondary text-text-light-bg bg-white hover:bg-bg-light-alt focus-visible:ring-primary shadow-sm',
    success: 'bg-success text-white hover:brightness-95 focus-visible:ring-success shadow-sm',
    hero: 'bg-gradient-to-r from-secondary to-secondary-end text-white hover:opacity-90 focus-visible:ring-secondary shadow-lg',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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

export default Button;
