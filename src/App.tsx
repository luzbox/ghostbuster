import { useAppStore } from './store';
import { ErrorBoundary, useToast, SearchInterface, HauntedRatingDisplay, MapInterface } from './components';

function App() {
  const { error } = useAppStore();
  const { } = useToast(); // Keep hook active but don't use toasts
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400 mb-2">
              👻 Ghostbuster - STEP 6 TEST
            </h1>
            <p className="text-gray-300 text-lg">
              MapInterface test - This will likely cause the error!
            </p>
            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-red-300">Store Error: {error}</p>
              </div>
            )}
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="space-y-6">
              <SearchInterface />
              <HauntedRatingDisplay />
            </div>
            <div>
              <MapInterface 
                currentLocation={undefined}
                hauntedRating={undefined}
                onLocationSelect={() => {}}
                className="h-96"
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;