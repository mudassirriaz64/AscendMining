import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const FAQAccordion = ({ items = [], expandedId = null, onToggle, className }) => {
  const handleToggle = (id) => {
    if (onToggle) onToggle(expandedId === id ? null : id);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              'group rounded-2xl border backdrop-blur-md transition-colors duration-300 overflow-hidden',
              isExpanded
                ? 'border-gold/30 bg-page-card-strong'
                : 'border-page-border bg-page-card hover:border-gold/20'
            )}
          >
            <h3>
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-expanded={isExpanded}
                aria-controls={`faq-panel-${item.id}`}
                id={`faq-trigger-${item.id}`}
                className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 font-heading font-medium text-sm text-page-text-muted transition-colors hover:text-page-text focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-2xl"
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'shrink-0 text-page-text-faint transition-transform duration-300 group-hover:text-gold',
                    isExpanded && 'rotate-180 text-gold'
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isExpanded ? (
                <m.div
                  key="content"
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-sm text-page-text-soft leading-relaxed border-t border-page-border-soft pt-4">
                    {item.answer}
                  </div>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
