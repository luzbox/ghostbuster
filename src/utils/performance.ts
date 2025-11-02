// Performance monitoring and optimization utilities
import React from 'react';

/**
 * Performance metrics tracking
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing an operation and record the duration
   */
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    this.timers.delete(name);
    
    return duration;
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Get a specific metric
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    console.group('🚀 Performance Metrics');
    for (const [name, value] of this.metrics.entries()) {
      console.log(`${name}: ${value.toFixed(2)}ms`);
    }
    console.groupEnd();
  }
}

/**
 * Measure component render time
 */
export function measureRender<T extends React.ComponentType<any>>(
  Component: T,
  displayName?: string
): T {
  const WrappedComponent = (props: any) => {
    const monitor = PerformanceMonitor.getInstance();
    const name = displayName || Component.displayName || Component.name || 'Component';
    
    React.useEffect(() => {
      monitor.startTimer(`${name}_render`);
      return () => {
        monitor.endTimer(`${name}_render`);
      };
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `Measured(${displayName || Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  name: string
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  
  monitor.startTimer(name);
  try {
    const result = await operation();
    const duration = monitor.endTimer(name);
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    monitor.endTimer(name);
    throw error;
  }
}

/**
 * Bundle size analyzer (development only)
 */
export const analyzeBundleSize = () => {
  if (import.meta.env.DEV) {
    // Estimate bundle size based on loaded modules
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('node_modules') || src.includes('src')) {
        // This is a rough estimate - in production you'd use webpack-bundle-analyzer
        totalSize += 1; // Placeholder
      }
    });
    
    console.log('📦 Estimated bundle info:', {
      scriptTags: scripts.length,
      estimatedChunks: scripts.filter(s => (s as HTMLScriptElement).src.includes('chunk')).length
    });
  }
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }
  return null;
};

/**
 * Network performance monitoring
 */
export const getNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

/**
 * Performance observer for Core Web Vitals
 */
export const observeWebVitals = () => {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('🎯 LCP:', lastEntry.startTime);
      PerformanceMonitor.getInstance().recordMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('⚡ FID:', entry.processingStart - entry.startTime);
        PerformanceMonitor.getInstance().recordMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📐 CLS:', clsValue);
      PerformanceMonitor.getInstance().recordMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

/**
 * Image lazy loading utility
 */
export const createLazyImage = (src: string, placeholder?: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Intersection Observer for lazy loading
 */
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }
  return null;
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Check if device has reduced motion preference
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if device is low-end
 */
export const isLowEndDevice = () => {
  const memory = getMemoryUsage();
  const connection = getNetworkInfo();
  
  // Consider device low-end if:
  // - Memory limit is less than 1GB
  // - Connection is slow (2G or slow 3G)
  // - Hardware concurrency is low
  return (
    (memory && memory.limit < 1024) ||
    (connection && ['slow-2g', '2g'].includes(connection.effectiveType)) ||
    navigator.hardwareConcurrency <= 2
  );
};

/**
 * Adaptive loading based on device capabilities
 */
export const getOptimalSettings = () => {
  const isLowEnd = isLowEndDevice();
  const reducedMotion = prefersReducedMotion();
  
  return {
    enableAnimations: !reducedMotion && !isLowEnd,
    imageQuality: isLowEnd ? 'low' : 'high',
    maxConcurrentRequests: isLowEnd ? 2 : 6,
    cacheSize: isLowEnd ? 50 : 200,
    enablePreloading: !isLowEnd,
    enableServiceWorker: true
  };
};

// Initialize performance monitoring in development
if (import.meta.env.DEV) {
  observeWebVitals();
  
  // Log performance info every 30 seconds
  setInterval(() => {
    const memory = getMemoryUsage();
    const network = getNetworkInfo();
    
    if (memory || network) {
      console.group('📊 Performance Status');
      if (memory) {
        console.log('Memory:', memory);
      }
      if (network) {
        console.log('Network:', network);
      }
      console.groupEnd();
    }
  }, 30000);
}