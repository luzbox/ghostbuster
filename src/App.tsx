import { useAppStore } from './store';
import { ErrorBoundary, SearchInterface, HauntedRatingDisplay } from './components';

function App() {
  const { 
    error
  } = useAppStore();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400 mb-2">
              👻 Ghostbuster
            </h1>
            <p className="text-gray-300 text-lg">
              Discover how haunted any location is with real-time data
            </p>
          </header>
          
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto space-y-8">
            <SearchInterface />
            <HauntedRatingDisplay />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;