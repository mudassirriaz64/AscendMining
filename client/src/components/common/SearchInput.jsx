import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg text-sm text-text-light-bg bg-input-bg placeholder:text-text-secondary/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
};

export default SearchInput;
