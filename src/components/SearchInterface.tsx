import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { searchLocationByName, analyzeLocation, calculateHauntedRating } from '../services';
import { Location } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
// Error handling is done inline with try/catch

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { 
    setCurrentLocation, 
    setHauntedRating,
    setLoading, 
    setError, 
    clearError,
    addToLocationHistory,
    locationHistory 
  } = useAppStore();

  // Debounce the search query
  const debouncedQuery = useDebounce(query, 500); // 500ms debounce

  // Memoized search function to prevent unnecessary re-renders
  const performSearch = useCallback(
    async (searchQuery: string) => {
      try {
        if (searchQuery.length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setIsSearching(true);
        clearError();
        
        const response = await searchLocationByName(searchQuery);
        const results = response || [];
        const searchSuggestions: SearchSuggestion[] = results.map((result: any, index: number) => ({
          id: `${result.coordinates.latitude}-${result.coordinates.longitude}-${index}`,
          name: result.name,
          address: result.address,
          coordinates: result.coordinates
        }));
        
        setSuggestions(searchSuggestions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
        setIsSearching(false);
      } catch (error: any) {
        setError(error.message || 'Search failed');
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
      }
    },
    [clearError, setError]
  );

  // Effect for debounced search
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleLocationSelect = async (suggestion: SearchSuggestion) => {
    try {
      setLoading(true);
      clearError();
      
      // Get detailed location information and calculate haunted rating in parallel
      const [detailedLocation, ratingResponse] = await Promise.all([
        analyzeLocation(suggestion.coordinates),
        calculateHauntedRating({
          coordinates: suggestion.coordinates,
          locationName: suggestion.name
        } as any)
      ]);
      
      setCurrentLocation(detailedLocation);
      // Extract the actual rating data from the API response
      const rating = (ratingResponse as any).data || ratingResponse;
      setHauntedRating(rating);
      addToLocationHistory(detailedLocation);
      setQuery(suggestion.name);
      setShowSuggestions(false);
      setLoading(false);
    } catch (error: any) {
      setError(error.message || 'Failed to select location');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (_e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const handleHistorySelect = async (location: Location) => {
    try {
      setLoading(true);
      clearError();
      
      // Calculate haunted rating for historical location
      const ratingResponse = await calculateHauntedRating({
        coordinates: location.coordinates,
        locationName: location.name
      } as any);

      setCurrentLocation(location);
      // Extract the actual rating data from the API response
      const rating = (ratingResponse as any).data || ratingResponse;
      setHauntedRating(rating);
      setQuery(location.name);
      setShowSuggestions(false);
      setLoading(false);
    } catch (error: any) {
      setError(error.message || 'Failed to select location from history');
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="location-search" className="sr-only">
          Search for a location to analyze its haunted rating
        </label>
        <input
          id="location-search"
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search for a spooky location..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-ghost-900 border border-ghost-700 rounded-lg text-ghost-100 placeholder-ghost-500 focus:outline-none focus:ring-2 focus:ring-haunted-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
          aria-describedby={showSuggestions ? "search-suggestions" : undefined}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-ghost-500 pointer-events-none" aria-hidden="true">
          <span role="img" aria-label="Search">🔍</span>
        </div>
        
        {/* Loading Spinner */}
        {isSearching && (
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2" aria-hidden="true">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || locationHistory.length > 0) && (
        <div 
          ref={suggestionsRef}
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-ghost-900 border border-ghost-700 rounded-lg shadow-xl z-50 max-h-64 sm:max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Recent Locations */}
          {query.length < 2 && locationHistory.length > 0 && (
            <div>
              <div className="px-3 sm:px-4 py-2 text-xs text-ghost-500 border-b border-ghost-800">
                Recent Locations
              </div>
              {locationHistory.slice(0, 3).map((location, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleHistorySelect(location)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-ghost-800 focus:bg-ghost-800 focus:outline-none transition-colors duration-150 border-b border-ghost-800 last:border-b-0"
                  role="option"
                  aria-selected={false}
                >
                  <div className="text-ghost-200 font-medium text-sm sm:text-base truncate">{location.name}</div>
                  <div className="text-ghost-500 text-xs sm:text-sm truncate">{location.address}</div>
                </button>
              ))}
            </div>
          )}
          
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div>
              {query.length >= 2 && locationHistory.length > 0 && (
                <div className="px-3 sm:px-4 py-2 text-xs text-ghost-500 border-b border-ghost-800">
                  Search Results
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLocationSelect(suggestion)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-colors duration-150 border-b border-ghost-800 last:border-b-0 focus:outline-none ${
                    index === selectedIndex 
                      ? 'bg-haunted-900/50 text-haunted-200' 
                      : 'hover:bg-ghost-800 focus:bg-ghost-800 text-ghost-200'
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="font-medium text-sm sm:text-base truncate">{suggestion.name}</div>
                  <div className="text-ghost-500 text-xs sm:text-sm truncate">{suggestion.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isSearching && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-ghost-900 border border-ghost-700 rounded-lg shadow-xl z-50 px-3 sm:px-4 py-4 sm:py-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="text-ghost-500 mb-2" role="img" aria-label="Ghost">👻</div>
          <div className="text-ghost-400 text-sm sm:text-base">No spooky locations found</div>
          <div className="text-ghost-600 text-xs sm:text-sm mt-1">Try a different search term</div>
        </div>
      )}
    </div>
  );
};