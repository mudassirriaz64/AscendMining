import { memo } from 'react';

const FilterChips = ({ options, active, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer
            ${active === option.value
              ? 'bg-primary text-text-light-bg border-primary'
              : 'bg-white text-text-secondary border-border-light hover:border-primary/50'}`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1.5 text-[10px] opacity-70">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default memo(FilterChips);
