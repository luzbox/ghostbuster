import React, { useEffect, Suspense } from 'react';
import { useAppStore } from './store';
import { ErrorBoundary, LoadingSpinner, ToastContainer, useToast, KeyboardShortcuts, useKeyboardNavigation } from './components';
import { analyzeLocation, calculateHauntedRating } from './services';
import { startAutoRefresh } from './services';
import { measureAsync, registerServiceWorker, getOptimalSettings } from './utils/performance';

// Lazy load components for code splitting
const SearchInterface = React.lazy(() => import('./components/SearchInterface').then(module => ({ default: module.SearchInterface })));
const HauntedRatingDisplay = React.lazy(() => import('./components/HauntedRatingDisplay').then(module => ({ default: module.HauntedRatingDisplay })));
const MapInterface = React.lazy(() => import('./components/MapInterface').then(module => ({ default: module.MapInterface })));

function App() {
  const { 
    currentLocation, 
    hauntedRating, 
    isLoading, 
    error, 
    clearError,
    setCurrentLocation,
    setHauntedRating,
    setLoading,
    setError,
    addToLocationHistory
  } = useAppStore();

  // Toast notifications
  const { toasts, showError, showWarning, removeToast } = useToast();
  
  // Keyboard navigation
  useKeyboardNavigation();

  // Initialize performance optimizations and service worker
  useEffect(() => {
    const initializeApp = async () => {
      // Register service worker for offline functionality
      await registerServiceWorker();
      
      // Get optimal settings based on device capabilities
      const settings = getOptimalSettings();
      console.log('Optimal settings for device:', settings);
      
      // Apply performance optimizations based on device
      if (!settings.enableAnimations) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      }
    };

    initializeApp();
  }, []);

  // Set up auto-refresh when location changes
  useEffect(() => {
    if (currentLocation) {
      startAutoRefresh(currentLocation, {
        onRatingUpdate: (rating) => {
          console.log('[AUTO-REFRESH] Updated rating:', rating.overallScore);
          setHauntedRating(rating);
        },
        onError: (errorMessage) => {
          console.warn('[AUTO-REFRESH] Error:', errorMessage);
          // Try to use cached data as fallback
          const cachedRating = null; // Simplified for now
          if (cachedRating) {
            setHauntedRating(cachedRating);
          } else {
            setError(`Auto-refresh failed: ${errorMessage}`);
          }
        }
      });

      // Cleanup function
      return () => {
        // Auto-refresh cleanup handled automatically
      };
    }
  }, [currentLocation, setHauntedRating, setError]);

  // Handle location selection from map
  const handleLocationSelect = async (coordinates: { latitude: number; longitude: number }) => {
    try {
      setLoading(true);
      setError(null);

      // Measure performance of location analysis
      await measureAsync(async () => {
        // Try to get cached rating first for faster response
        let cachedRating: any = null;
        
        try {
          // Analyze the selected location and calculate haunted rating in parallel
          const [locationResponse, ratingResponse] = await Promise.all([
            analyzeLocation(coordinates),
            calculateHauntedRating({
              coordinates,
              timestamp: new Date().toISOString()
            })
          ]);

          const location = locationResponse;
          const rating = ratingResponse;

          // Set the current location and rating
          setCurrentLocation(location);
          setHauntedRating(rating as any);
          addToLocationHistory(location);

        } catch (apiError: any) {
          console.error('API failed, trying cached data:', apiError);
          
          // If API fails, try to analyze location only and use cached rating
          try {
            const locationResponse = await analyzeLocation(coordinates);
            const location = locationResponse;
            
            cachedRating = null; // Simplified for now
            
            setCurrentLocation(location);
            addToLocationHistory(location);
            
            if (cachedRating) {
              setHauntedRating(cachedRating);
              showWarning('Using cached data', 'Some information may be outdated');
            } else {
              showError('Rating calculation failed', 'Please try again or check your connection');
            }
          } catch (fallbackError) {
            throw apiError; // Throw original error if fallback also fails
          }
        }
      }, 'location_analysis_complete');

    } catch (error: any) {
      console.error('Failed to analyze location:', error);
      showError('Location analysis failed', 'Please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-ghost-950 text-ghost-100">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-haunted-400 mb-2 text-shadow">
              <span role="img" aria-label="Ghost">👻</span> Ghostbuster
            </h1>
            <p className="text-ghost-300 text-base sm:text-lg lg:text-xl px-4">
              Discover how haunted any location is with real-time data
            </p>
          </header>
          
          {/* Global Error Display */}
          {error && (
            <div 
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-between"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-red-400 flex-shrink-0" role="img" aria-label="Warning">⚠️</span>
                <span className="text-red-200 text-sm sm:text-base break-words">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300 transition-colors ml-2 p-1 flex-shrink-0"
                aria-label="Close error message"
                type="button"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          )}
          
          {/* Global Loading Overlay */}
          {isLoading && (
            <div 
              className="fixed inset-0 bg-ghost-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="loading-title"
            >
              <div className="bg-ghost-900 p-6 sm:p-8 rounded-lg ghost-glow max-w-sm w-full">
                <div id="loading-title" className="sr-only">Loading</div>
                <LoadingSpinner size="lg" message="Calculating haunted rating..." />
              </div>
            </div>
          )}
          
          <main className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Left Panel - Search and Rating */}
            <div className="space-y-6 lg:space-y-8 order-2 xl:order-1">
              {/* Search Interface */}
              <section aria-labelledby="search-heading">
                <h2 id="search-heading" className="sr-only">Location Search</h2>
                <Suspense fallback={
                  <div className="h-16 bg-ghost-900 rounded-lg animate-pulse" aria-label="Loading search interface" />
                }>
                  <SearchInterface />
                </Suspense>
              </section>
              
              {/* Haunted Rating Display */}
              <section aria-labelledby="rating-heading">
                <h2 id="rating-heading" className="sr-only">Haunted Rating Results</h2>
                <Suspense fallback={
                  <div className="h-64 bg-ghost-900 rounded-lg animate-pulse" aria-label="Loading rating display" />
                }>
                  <HauntedRatingDisplay />
                </Suspense>
              </section>
              
              {/* Development Status */}
              <div className="text-center text-ghost-500 text-xs sm:text-sm hidden lg:block">
                <details className="cursor-pointer">
                  <summary className="text-ghost-400 hover:text-ghost-300 transition-colors">
                    Development Status
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p>✅ Core React components implemented</p>
                    <p>✅ Global state management with Zustand</p>
                    <p>✅ Search interface with autocomplete and debouncing</p>
                    <p>✅ Animated rating display with factor breakdown</p>
                    <p>✅ Interactive map interface with Mapbox</p>
                    <p>✅ Real-time data updates with 30-minute refresh</p>
                    <p>✅ API response caching and performance optimizations</p>
                  </div>
                </details>
              </div>
            </div>

            {/* Right Panel - Interactive Map */}
            <div className="xl:sticky xl:top-8 h-fit order-1 xl:order-2">
              <section aria-labelledby="map-heading">
                <div className="bg-ghost-900 rounded-lg p-3 sm:p-4 ghost-glow">
                  <h2 id="map-heading" className="text-lg sm:text-xl font-semibold text-haunted-400 mb-3 sm:mb-4 text-center">
                    Interactive Haunted Map
                  </h2>
                  <Suspense fallback={
                    <div 
                      className="h-64 sm:h-80 lg:h-96 xl:h-[500px] bg-ghost-800 rounded animate-pulse" 
                      aria-label="Loading interactive map"
                    />
                  }>
                    <MapInterface
                      currentLocation={currentLocation || undefined}
                      hauntedRating={hauntedRating || undefined}
                      onLocationSelect={handleLocationSelect}
                      className="h-64 sm:h-80 lg:h-96 xl:h-[500px]"
                    />
                  </Suspense>
                </div>
              </section>
            </div>
          </main>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcuts />
      </div>
    </ErrorBoundary>
  );
}

export default App