import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="h-screen overflow-hidden bg-[#f0f2f5] flex flex-col font-sans">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#001f3f] to-[#083358] py-4 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo Placeholder */}
          <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse"></div>
          {/* Nav Links Placeholder */}
          <div className="hidden md:flex space-x-8">
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
          </div>
          {/* Sign Out Button Placeholder */}
          <div className="w-24 h-8 bg-white/15 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Main Container Skeleton */}
      <div className="max-w-7xl w-full mx-auto px-6 py-10 flex-grow space-y-10">
        
        {/* Title Placeholder */}
        <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse"></div>

        {/* 3 Columns Stats Cards Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[200px] flex flex-col justify-between"
            >
              <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-slate-200 rounded animate-pulse"></div>
                <div className="w-36 h-6 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Block Placeholder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="w-40 h-5 bg-slate-200 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
            <div className="w-11/12 h-4 bg-slate-100 rounded animate-pulse"></div>
            <div className="w-4/5 h-4 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
