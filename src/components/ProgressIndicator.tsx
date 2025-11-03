import React from 'react';
import { motion } from 'framer-motion';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep: _currentStep,
  className = ''
}) => {
  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'active':
        return '🔄';
      case 'error':
        return '❌';
      case 'pending':
      default:
        return '⏳';
    }
  };

  const getStepColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'active':
        return 'text-haunted-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
      default:
        return 'text-ghost-500';
    }
  };

  return (
    <div className={`space-y-3 ${className}`} role="progressbar" aria-label="Loading progress">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
            step.status === 'active' ? 'bg-ghost-800/50' : ''
          }`}
        >
          <div className="flex-shrink-0">
            <span 
              className={`text-lg ${getStepColor(step.status)}`}
              role="img"
              aria-label={step.status}
            >
              {getStepIcon(step.status)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${getStepColor(step.status)}`}>
              {step.label}
            </div>
            {step.description && (
              <div className="text-xs text-ghost-500 mt-1">
                {step.description}
              </div>
            )}
          </div>
          
          {step.status === 'active' && (
            <div className="flex-shrink-0">
              <div className="w-4 h-4 border-2 border-haunted-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

interface LinearProgressProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  className = ''
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const colorClasses = {
    primary: 'bg-haunted-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm text-ghost-300">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs text-ghost-400">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-ghost-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 64,
  strokeWidth = 4,
  color = 'primary',
  showValue = true,
  label,
  className = ''
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const colorClasses = {
    primary: 'stroke-haunted-500',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500'
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-ghost-800"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            className={colorClasses[color]}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-ghost-200">
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
      
      {label && (
        <span className="text-xs text-ghost-400 mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
};

// Skeleton loader for better perceived performance
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular'
}) => {
  const baseClasses = 'bg-ghost-800 animate-pulse';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-label="Loading content"
    />
  );
};

// Pulse animation for loading states
interface PulseProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`${isLoading ? 'animate-pulse opacity-70' : ''} ${className}`}>
      {children}
    </div>
  );
};