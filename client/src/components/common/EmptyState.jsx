import { FileX } from 'lucide-react';

const EmptyState = ({ icon: Icon = FileX, title = 'No data found', description = '' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-light-alt flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-secondary" />
      </div>
      <h3 className="text-sm font-medium text-text-light-bg mb-1">{title}</h3>
      {description && <p className="text-xs text-text-secondary max-w-xs">{description}</p>}
    </div>
  );
};

export default EmptyState;
