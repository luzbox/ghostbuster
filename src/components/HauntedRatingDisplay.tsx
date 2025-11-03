import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { FactorBreakdown } from '../types';
import { getTimeUntilNextRefresh } from '../services';

// Helper function to get session key (duplicated from service for component use)
const getSessionKey = (location: any): string => {
  return `session_${location.coordinates.latitude.toFixed(4)}_${location.coordinates.longitude.toFixed(4)}`;
};

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

interface RatingMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const RatingMeter: React.FC<RatingMeterProps> = ({ score, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const getRatingColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-blue-400';
    return 'text-ghost-400';
  };

  const getRatingGlow = (score: number) => {
    if (score >= 80) return 'shadow-red-500/50';
    if (score >= 60) return 'shadow-orange-500/50';
    if (score >= 40) return 'shadow-yellow-500/50';
    if (score >= 20) return 'shadow-blue-500/50';
    return 'shadow-ghost-500/50';
  };

  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-ghost-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          className={getRatingColor(score)}
          style={{
            strokeDasharray,
            strokeDashoffset
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${textSizeClasses[size]} font-bold ${getRatingColor(score)} ${getRatingGlow(score)} drop-shadow-lg`}>
        <AnimatedNumber value={score} />
      </div>
    </div>
  );
};

interface FactorBarProps {
  factor: FactorBreakdown;
  maxContribution: number;
}

const FactorBar: React.FC<FactorBarProps> = ({ factor, maxContribution }) => {
  const percentage = maxContribution > 0 ? (factor.contribution / maxContribution) * 100 : 0;
  
  const getFactorIcon = (factorName: string) => {
    const name = factorName.toLowerCase();
    if (name.includes('location')) return '🏚️';
    if (name.includes('weather')) return '🌧️';
    if (name.includes('time')) return '🌙';
    if (name.includes('season')) return '🍂';
    return '👻';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
          <span role="img" aria-hidden="true">{getFactorIcon(factor.factor)}</span>
          <span className="text-ghost-300 font-medium truncate">{factor.factor}</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <span className="text-ghost-400">+{factor.contribution.toFixed(1)}</span>
          <span className="text-ghost-600 text-xs">({factor.weight}%)</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-ghost-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-haunted-600 to-haunted-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
      
      <p className="text-xs text-ghost-500 leading-relaxed break-words">
        {factor.description}
      </p>
    </motion.div>
  );
};

export const HauntedRatingDisplay: React.FC = () => {
  const { 
    hauntedRating, 
    isRatingExpanded, 
    toggleRatingExpanded,
    currentLocation 
  } = useAppStore();

  // Debug logging removed - issue was API response not being extracted properly

  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update refresh timer
  useEffect(() => {
    if (!currentLocation) return;

    const sessionKey = getSessionKey(currentLocation);
    
    const updateTimer = () => {
      const timeLeft = getTimeUntilNextRefresh(sessionKey);
      setTimeUntilRefresh(timeLeft);
      
      // Check if refresh is happening soon (within 5 seconds)
      if (timeLeft !== null && timeLeft < 5000) {
        setIsRefreshing(true);
      } else {
        setIsRefreshing(false);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every 30 seconds
    const interval = setInterval(updateTimer, 30000);
    
    return () => clearInterval(interval);
  }, [currentLocation]);

  const formatTimeUntilRefresh = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!hauntedRating) {
    return (
      <div className="text-center p-6 sm:p-8">
        <div className="text-4xl sm:text-6xl mb-4 opacity-50" role="img" aria-label="Ghost">👻</div>
        <p className="text-ghost-500 text-sm sm:text-base">Select a location to see its haunted rating</p>
      </div>
    );
  }

  const getRatingDescription = (score: number) => {
    if (score >= 90) return { text: "Extremely Haunted", emoji: "💀" };
    if (score >= 80) return { text: "Very Haunted", emoji: "👻" };
    if (score >= 70) return { text: "Quite Haunted", emoji: "🎃" };
    if (score >= 60) return { text: "Moderately Haunted", emoji: "🕷️" };
    if (score >= 40) return { text: "Somewhat Spooky", emoji: "🦇" };
    if (score >= 20) return { text: "Mildly Eerie", emoji: "🕯️" };
    return { text: "Not Very Haunted", emoji: "🌙" };
  };

  const description = getRatingDescription(hauntedRating.overallScore);
  const maxContribution = hauntedRating.breakdown && hauntedRating.breakdown.length > 0 
    ? Math.max(...hauntedRating.breakdown.map(f => f.contribution))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-ghost-900 rounded-lg p-4 sm:p-6 ghost-glow w-full"
      role="region"
      aria-labelledby="rating-title"
    >
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 id="rating-title" className="text-lg sm:text-xl font-bold text-ghost-200 mb-2">
          Haunted Rating
        </h2>
        {currentLocation && (
          <p className="text-ghost-400 text-xs sm:text-sm truncate px-2">
            {currentLocation.name}
          </p>
        )}
      </div>

      {/* Rating Display */}
      <div className="flex flex-col items-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div aria-label={`Haunted rating: ${hauntedRating.overallScore} out of 100`}>
          <RatingMeter score={hauntedRating.overallScore} size="lg" />
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2 flex-wrap">
            <span className="text-xl sm:text-2xl" role="img" aria-label={description.text}>{description.emoji}</span>
            <span className="text-base sm:text-lg font-semibold text-ghost-200">
              {description.text}
            </span>
            {isRefreshing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-haunted-400"
                aria-label="Refreshing data"
                role="img"
              >
                🔄
              </motion.div>
            )}
          </div>
          <p className="text-ghost-500 text-xs sm:text-sm">
            Calculated {new Date(hauntedRating.calculatedAt).toLocaleTimeString()}
          </p>
          {timeUntilRefresh !== null && (
            <p className="text-ghost-600 text-xs mt-1">
              Auto-refresh in {formatTimeUntilRefresh(timeUntilRefresh)}
            </p>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={toggleRatingExpanded}
        className="w-full flex items-center justify-center space-x-2 py-2 sm:py-3 px-3 sm:px-4 bg-ghost-800 hover:bg-ghost-700 focus:bg-ghost-700 focus:outline-none focus:ring-2 focus:ring-haunted-500 rounded-lg transition-colors duration-200 mb-3 sm:mb-4"
        aria-expanded={isRatingExpanded}
        aria-controls="factor-breakdown"
        type="button"
      >
        <span className="text-ghost-300 text-sm sm:text-base">
          {isRatingExpanded ? 'Hide Details' : 'Show Factor Breakdown'}
        </span>
        <motion.span
          animate={{ rotate: isRatingExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ghost-400"
          aria-hidden="true"
        >
          ▼
        </motion.span>
      </button>

      {/* Factor Breakdown */}
      <AnimatePresence>
        {isRatingExpanded && (
          <motion.div
            id="factor-breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            role="region"
            aria-labelledby="factors-heading"
          >
            <div className="space-y-3 sm:space-y-4 pt-2">
              <h3 id="factors-heading" className="text-xs sm:text-sm font-semibold text-ghost-300 border-b border-ghost-800 pb-2">
                Contributing Factors
              </h3>
              
              {hauntedRating.breakdown && hauntedRating.breakdown.map((factor, index) => (
                <FactorBar
                  key={`${factor.factor}-${index}`}
                  factor={factor}
                  maxContribution={maxContribution}
                />
              ))}
              
              <div className="pt-3 sm:pt-4 border-t border-ghost-800">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-ghost-400">Total Score:</span>
                  <span className="font-bold text-ghost-200">
                    {hauntedRating.overallScore}/100
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};