import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GhostVisualizationProps {
  intensity: number; // 0-1 scale based on haunted rating
  position: { latitude: number; longitude: number };
  animationType?: 'float' | 'drift' | 'fade';
  isVisible?: boolean;
  onAnimationComplete?: () => void;
}

interface GhostElement {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  type: 'wisp' | 'orb' | 'shadow';
}

export const GhostVisualization: React.FC<GhostVisualizationProps> = ({
  intensity,
  position: _position,
  animationType = 'float',
  isVisible = true,
  onAnimationComplete
}) => {
  const [ghosts, setGhosts] = useState<GhostElement[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate ghost density based on intensity
  const ghostCount = useMemo(() => {
    if (intensity <= 0.2) return 1;
    if (intensity <= 0.4) return 2;
    if (intensity <= 0.6) return 3;
    if (intensity <= 0.8) return 5;
    return 8; // Maximum ghosts for highest intensity
  }, [intensity]);

  // Generate ghost elements based on intensity
  useEffect(() => {
    const generateGhosts = (): GhostElement[] => {
      const newGhosts: GhostElement[] = [];
      
      for (let i = 0; i < ghostCount; i++) {
        const ghostType = intensity > 0.7 ? 'shadow' : intensity > 0.4 ? 'orb' : 'wisp';
        
        newGhosts.push({
          id: `ghost-${i}-${Date.now()}`,
          x: Math.random() * 100, // Percentage position
          y: Math.random() * 100,
          size: 20 + (intensity * 30) + (Math.random() * 20), // Size varies with intensity
          opacity: 0.3 + (intensity * 0.4) + (Math.random() * 0.3),
          animationDelay: Math.random() * 2000, // Stagger animations
          type: ghostType
        });
      }
      
      return newGhosts;
    };

    setGhosts(generateGhosts());
  }, [intensity, ghostCount]);

  // Animation variants for different ghost types
  const getAnimationVariants = (ghost: GhostElement) => {
    const baseVariants = {
      hidden: {
        opacity: 0,
        scale: 0.5,
        y: 20
      },
      visible: {
        opacity: ghost.opacity,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.8,
          delay: ghost.animationDelay / 1000,
          ease: "easeOut"
        }
      },
      exit: {
        opacity: 0,
        scale: 0.3,
        y: -20,
        transition: {
          duration: 0.5,
          ease: "easeIn"
        }
      }
    };

    // Add specific animation patterns based on type
    switch (animationType) {
      case 'float':
        return {
          ...baseVariants,
          visible: {
            ...baseVariants.visible,
            y: [0, -10, 0],
            transition: {
              ...baseVariants.visible.transition,
              y: {
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
          }
        };
      
      case 'drift':
        return {
          ...baseVariants,
          visible: {
            ...baseVariants.visible,
            x: [0, 15, -10, 0],
            y: [0, -8, -15, 0],
            transition: {
              ...baseVariants.visible.transition,
              x: {
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              y: {
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
          }
        };
      
      case 'fade':
        return {
          ...baseVariants,
          visible: {
            ...baseVariants.visible,
            opacity: [ghost.opacity, ghost.opacity * 0.3, ghost.opacity],
            transition: {
              ...baseVariants.visible.transition,
              opacity: {
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
          }
        };
      
      default:
        return baseVariants;
    }
  };

  // Get ghost appearance based on type
  const getGhostAppearance = (ghost: GhostElement) => {
    switch (ghost.type) {
      case 'wisp':
        return {
          background: `radial-gradient(circle, rgba(147, 197, 253, ${ghost.opacity}) 0%, rgba(147, 197, 253, 0) 70%)`,
          borderRadius: '50%',
          filter: 'blur(1px)',
          boxShadow: `0 0 ${ghost.size * 0.5}px rgba(147, 197, 253, ${ghost.opacity * 0.8})`
        };
      
      case 'orb':
        return {
          background: `radial-gradient(circle, rgba(168, 85, 247, ${ghost.opacity}) 0%, rgba(168, 85, 247, 0) 60%)`,
          borderRadius: '50%',
          filter: 'blur(0.5px)',
          boxShadow: `0 0 ${ghost.size * 0.7}px rgba(168, 85, 247, ${ghost.opacity * 0.9})`
        };
      
      case 'shadow':
        return {
          background: `radial-gradient(ellipse, rgba(75, 85, 99, ${ghost.opacity}) 0%, rgba(75, 85, 99, 0) 50%)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          filter: 'blur(2px)',
          boxShadow: `0 0 ${ghost.size}px rgba(75, 85, 99, ${ghost.opacity * 0.6})`
        };
      
      default:
        return {};
    }
  };

  // Handle animation lifecycle
  useEffect(() => {
    if (isVisible && ghosts.length > 0) {
      setIsAnimating(true);
      
      // Complete animation after all ghosts have appeared
      const maxDelay = Math.max(...ghosts.map(g => g.animationDelay));
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, maxDelay + 1000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, ghosts, onAnimationComplete]);

  // Don't render if intensity is too low
  if (intensity < 0.1) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 10 // Ensure ghosts appear above map but below UI
      }}
    >
      <AnimatePresence mode="wait">
        {isVisible && ghosts.map((ghost) => (
          <motion.div
            key={ghost.id}
            className="absolute"
            style={{
              left: `${ghost.x}%`,
              top: `${ghost.y}%`,
              width: `${ghost.size}px`,
              height: `${ghost.size}px`,
              ...getGhostAppearance(ghost)
            }}
            variants={getAnimationVariants(ghost)}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={(definition) => {
              if (definition === "visible" && !isAnimating) {
                onAnimationComplete?.();
              }
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Atmospheric overlay for high intensity */}
      {intensity > 0.7 && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(75, 85, 99, ${intensity * 0.1}) 0%, transparent 70%)`,
            pointerEvents: 'none'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        />
      )}
    </div>
  );
};

export default GhostVisualization;