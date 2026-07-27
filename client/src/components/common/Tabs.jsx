import { useState } from 'react';

const Tabs = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  const current = tabs.find((t) => t.key === activeTab);

  return (
    <div>
      <div className="flex gap-1 border-b border-border-light overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer
              ${activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-light-bg hover:border-border-light'}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
      <div className="py-4">
        {current?.content}
      </div>
    </div>
  );
};

export default Tabs;
