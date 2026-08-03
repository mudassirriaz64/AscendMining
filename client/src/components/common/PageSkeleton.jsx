import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col font-sans">
      {/* Header Skeleton */}
      <div className="bg-surface border-b border-outline-variant py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center">
          {/* Logo Placeholder */}
          <div className="w-32 h-8 bg-surface-container-high rounded animate-pulse"></div>
          {/* Nav Links Placeholder */}
          <div className="hidden md:flex space-x-8">
            <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse"></div>
          </div>
          {/* Sign Out Button Placeholder */}
          <div className="w-24 h-8 bg-surface-container-high rounded animate-pulse"></div>
        </div>
      </div>

      {/* Main Container Skeleton */}
      <div className="max-w-6xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        
        {/* Title Placeholder */}
        <div className="w-48 h-6 bg-surface-container-high rounded animate-pulse"></div>

        {/* 3 Columns Stats Cards Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-surface-container-lowest p-card-padding rounded-xl border border-outline-variant h-[180px] flex flex-col justify-between"
            >
              <div className="w-12 h-12 bg-surface-container-high rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-surface-container-low rounded animate-pulse"></div>
                <div className="w-36 h-6 bg-surface-container-high rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Block Placeholder */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding space-y-6">
          <div className="w-40 h-5 bg-surface-container-high rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="w-full h-4 bg-surface-container-low rounded animate-pulse"></div>
            <div className="w-11/12 h-4 bg-surface-container-low rounded animate-pulse"></div>
            <div className="w-4/5 h-4 bg-surface-container-low rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
