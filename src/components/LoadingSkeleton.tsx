import React from "react";

export function CardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-slate-800 rounded"></div>
        <div className="h-8 w-8 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="space-y-2">
        <div className="h-8 w-16 bg-slate-800 rounded"></div>
        <div className="h-3 w-32 bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-slate-800 rounded"></div>
        <div className="h-8 w-32 bg-slate-800 rounded"></div>
      </div>
      <div className="space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-800">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-800 rounded col-span-3"></div>
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-12 gap-4 py-2 border-b border-slate-800/50">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-5 bg-slate-800 rounded col-span-3"
                style={{ opacity: 1 - rowIndex * 0.15 }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
      <div className="h-5 w-36 bg-slate-800 rounded mb-4"></div>
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
              <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
