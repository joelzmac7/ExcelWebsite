import React from 'react';

const JobListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div className="w-3/4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-10"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobListSkeleton;