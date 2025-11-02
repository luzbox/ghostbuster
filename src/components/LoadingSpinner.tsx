import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-12 sm:h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base'
  };

  return (
    <div 
      className="flex flex-col items-center justify-center space-y-2"
      role="status"
      aria-live="polite"
    >
      <div 
        className={`${sizeClasses[size]} animate-spin`}
        aria-hidden="true"
      >
        <div className="w-full h-full border-2 border-ghost-600 border-t-haunted-400 rounded-full"></div>
      </div>
      {message && (
        <p className={`text-ghost-400 ${textSizeClasses[size]} animate-pulse text-center px-2`}>
          {message}
        </p>
      )}
      <span className="sr-only">{message || 'Loading content'}</span>
    </div>
  );
};