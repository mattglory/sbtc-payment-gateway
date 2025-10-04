import React from 'react';
import { clsx } from 'clsx';

const LoadingSkeleton = ({ className = "", variant = "default" }) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    circle: "h-12 w-12 rounded-full",
    text: "h-4 w-3/4",
    button: "h-12 w-32 rounded-lg",
    chart: "h-64 w-full rounded-xl"
  };

  return (
    <div className={clsx(baseClasses, variants[variant], className)} />
  );
};

export const ESGLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <LoadingSkeleton variant="button" className="mx-auto mb-6" />
          <LoadingSkeleton variant="text" className="h-8 w-96 mx-auto mb-4" />
          <LoadingSkeleton variant="text" className="h-6 w-64 mx-auto" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-24 w-full rounded-xl" />
          </div>
          <LoadingSkeleton variant="button" className="w-full h-12 rounded-xl" />
        </div>

        {/* Score Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <LoadingSkeleton variant="circle" className="h-12 w-12" />
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-4 w-20" />
                    <LoadingSkeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <LoadingSkeleton className="h-8 w-12 mb-1" />
                  <LoadingSkeleton className="h-3 w-8" />
                </div>
              </div>
              <LoadingSkeleton className="h-2 w-full rounded-full mb-4" />
              <div className="space-y-2">
                <LoadingSkeleton className="h-3 w-full" />
                <LoadingSkeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <LoadingSkeleton className="h-5 w-32 mb-4" />
            <LoadingSkeleton variant="chart" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <LoadingSkeleton className="h-5 w-32 mb-4" />
            <LoadingSkeleton variant="chart" />
          </div>
        </div>

        {/* Analysis Details Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <LoadingSkeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <LoadingSkeleton variant="circle" className="h-5 w-5" />
                    <div className="flex-1 space-y-2">
                      <LoadingSkeleton className="h-3 w-full" />
                      <LoadingSkeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <LoadingSkeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-5/6" />
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;