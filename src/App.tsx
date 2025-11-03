import { useAppStore } from './store';
// React imports removed since not currently used
import { ErrorBoundary, SearchInterface, HauntedRatingDisplay, MapInterface, ToastContainer, useToast, LoadingSpinner } from './components';
import { analyzeLocation, calculateHauntedRating } from './services';

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
  const { toasts, showError, removeToast } = useToast();

  // Handle location selection from map
  const handleLocationSelect = async (coordinates: { latitude: number; longitude: number }) => {
    try {
      setLoading(true);
      setError(null);

      // Analyze the selected location and calculate haunted rating in parallel
      const [locationResponse, ratingResponse] = await Promise.all([
        analyzeLocation(coordinates),
        calculateHauntedRating({
          coordinates,
          locationName: `Location ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
        } as any)
      ]);

      setCurrentLocation(locationResponse);
      setHauntedRating(ratingResponse as any);
      addToLocationHistory(locationResponse);

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
                <SearchInterface />
              </section>
              
              {/* Haunted Rating Display */}
              <section aria-labelledby="rating-heading">
                <h2 id="rating-heading" className="sr-only">Haunted Rating Results</h2>
                <HauntedRatingDisplay />
              </section>
            </div>

            {/* Right Panel - Interactive Map */}
            <div className="xl:sticky xl:top-8 h-fit order-1 xl:order-2">
              <section aria-labelledby="map-heading">
                <div className="bg-ghost-900 rounded-lg p-3 sm:p-4 ghost-glow">
                  <h2 id="map-heading" className="text-lg sm:text-xl font-semibold text-haunted-400 mb-3 sm:mb-4 text-center">
                    Interactive Haunted Map
                  </h2>
                  <MapInterface
                    currentLocation={currentLocation || undefined}
                    hauntedRating={hauntedRating || undefined}
                    onLocationSelect={handleLocationSelect}
                    className="h-64 sm:h-80 lg:h-96 xl:h-[500px]"
                  />
                </div>
              </section>
            </div>
          </main>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ErrorBoundary>
  );
}

export default App;