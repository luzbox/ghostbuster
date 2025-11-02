import React, { useRef, useEffect, useState } from 'react';
import { Location, HauntedRating } from '../types';
import { useAppStore } from '../store';
import { GhostVisualization } from './GhostVisualization';

// Dynamic import for Mapbox to handle potential loading issues
let mapboxgl: any = null;

interface MapInterfaceProps {
  currentLocation?: Location;
  hauntedRating?: HauntedRating;
  onLocationSelect: (coordinates: { latitude: number; longitude: number }) => void;
  className?: string;
}

export const MapInterface: React.FC<MapInterfaceProps> = ({
  currentLocation,
  hauntedRating,
  onLocationSelect,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fps, setFps] = useState(60);
  const [showHistory, setShowHistory] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [ghostVisualizations, setGhostVisualizations] = useState<Array<{
    id: string;
    location: Location;
    rating: HauntedRating;
    isVisible: boolean;
  }>>([]);
  const { setError, locationHistory } = useAppStore();
  
  // Performance monitoring
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsInterval = useRef<number | null>(null);

  // Animation configuration
  const ANIMATION_CONFIG = {
    duration: 2000, // 2 seconds
    easing: 'easeInOutCubic',
    spinDuration: 1000, // 1 second for globe spin
    zoomLevel: 14
  };

  // Animate to location with spinning globe effect
  const animateToLocation = (coordinates: { latitude: number; longitude: number }) => {
    if (!map.current || !isMapLoaded || isAnimating) return;

    setIsAnimating(true);
    const { latitude, longitude } = coordinates;

    // Phase 1: Zoom out and spin the globe
    const currentZoom = map.current.getZoom();
    const currentCenter = map.current.getCenter();
    
    // Calculate the bearing for spinning effect
    const bearing = calculateBearing(currentCenter, { lng: longitude, lat: latitude });
    
    // First, zoom out and spin
    map.current.easeTo({
      zoom: Math.max(1, currentZoom - 3),
      bearing: bearing + 180, // Spin 180 degrees
      duration: ANIMATION_CONFIG.spinDuration,
      easing: 'easeInOutQuad'
    });

    // Phase 2: Fly to target location after spin
    setTimeout(() => {
      if (map.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: ANIMATION_CONFIG.zoomLevel,
          bearing: 0, // Reset bearing
          pitch: 0,
          duration: ANIMATION_CONFIG.duration,
          essential: true,
          easing: (t: number) => {
            // Custom easing for smooth animation
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
          }
        });

        // Animation complete callback
        map.current.once('moveend', () => {
          setIsAnimating(false);
        });
      }
    }, ANIMATION_CONFIG.spinDuration);
  };

  // Calculate bearing between two points for spinning effect
  const calculateBearing = (start: any, end: any): number => {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  // Smooth zoom animation
  const animateZoom = (targetZoom: number, duration: number = 1000) => {
    if (!map.current || !isMapLoaded) return;

    map.current.easeTo({
      zoom: targetZoom,
      duration,
      easing: 'easeInOutCubic'
    });
  };

  // Pulse animation for markers
  const createPulsingMarker = (intensity: number = 1) => {
    const size = Math.max(20, 20 + (intensity * 10));
    const pulseSize = size + 10;
    
    const markerElement = document.createElement('div');
    markerElement.className = 'pulsing-marker';
    markerElement.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: #ff6b6b;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 ${intensity * 10}px rgba(255, 107, 107, 0.6);
      cursor: pointer;
      position: relative;
      animation: pulse 2s infinite;
    `;

    // Add CSS animation for pulsing effect
    if (!document.getElementById('marker-animations')) {
      const style = document.createElement('style');
      style.id = 'marker-animations';
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 ${intensity * 10}px rgba(255, 107, 107, 0.6);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 ${intensity * 15}px rgba(255, 107, 107, 0.8);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 ${intensity * 10}px rgba(255, 107, 107, 0.6);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .marker-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `;
      document.head.appendChild(style);
    }

    markerElement.classList.add('marker-fade-in');
    return markerElement;
  };

  // Performance monitoring for 60fps animations
  const startPerformanceMonitoring = () => {
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime.current + 1000) {
        const currentFPS = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setFps(currentFPS);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      if (isAnimating) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    if (isAnimating) {
      requestAnimationFrame(measureFPS);
    }
  };

  // Monitor performance during animations
  useEffect(() => {
    if (isAnimating) {
      startPerformanceMonitoring();
    }
  }, [isAnimating]);

  // Optimize map performance
  const optimizeMapPerformance = () => {
    if (!map.current) return;

    // Reduce quality on slower devices
    if (fps < 30) {
      map.current.getCanvas().style.imageRendering = 'pixelated';
      console.warn('Reduced map quality due to low FPS:', fps);
    } else {
      map.current.getCanvas().style.imageRendering = 'auto';
    }
  };

  // Apply performance optimizations when FPS changes
  useEffect(() => {
    optimizeMapPerformance();
  }, [fps]);

  // Handle quick access to previous locations
  const handleQuickAccess = (location: Location) => {
    if (comparisonMode) {
      // Add to comparison if not already selected
      if (!selectedLocations.find(loc => 
        loc.coordinates.latitude === location.coordinates.latitude &&
        loc.coordinates.longitude === location.coordinates.longitude
      )) {
        setSelectedLocations(prev => [...prev, location]);
        addComparisonMarker(location);
        
        // Add ghost visualization for comparison location (with default rating if not available)
        const defaultRating: HauntedRating = {
          overallScore: 50, // Default moderate rating for comparison
          factors: { locationScore: 20, weatherScore: 12.5, timeScore: 12.5, seasonScore: 5 },
          breakdown: [],
          calculatedAt: new Date()
        };
        addGhostVisualization(location, defaultRating);
      }
    } else {
      // Navigate to location
      onLocationSelect(location.coordinates);
    }
  };

  // Add comparison marker for multiple locations
  const addComparisonMarker = (location: Location) => {
    if (!map.current || !mapboxgl) return;

    const markerElement = document.createElement('div');
    markerElement.className = 'comparison-marker';
    markerElement.style.cssText = `
      width: 16px;
      height: 16px;
      background: #8b5cf6;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
      cursor: pointer;
    `;

    new mapboxgl.Marker(markerElement)
      .setLngLat([location.coordinates.longitude, location.coordinates.latitude])
      .addTo(map.current);
  };

  // Clear comparison markers
  const clearComparisonMarkers = () => {
    const markers = document.querySelectorAll('.comparison-marker');
    markers.forEach(marker => marker.remove());
    setSelectedLocations([]);
  };

  // Add ghost visualization for a location
  const addGhostVisualization = (location: Location, rating: HauntedRating) => {
    const ghostId = `ghost-${location.coordinates.latitude}-${location.coordinates.longitude}`;
    
    setGhostVisualizations(prev => {
      // Remove existing ghost for this location
      const filtered = prev.filter(ghost => ghost.id !== ghostId);
      
      // Add new ghost visualization
      return [...filtered, {
        id: ghostId,
        location,
        rating,
        isVisible: true
      }];
    });
  };

  // Update ghost visualization when rating changes
  const updateGhostVisualization = (location: Location, rating: HauntedRating) => {
    const ghostId = `ghost-${location.coordinates.latitude}-${location.coordinates.longitude}`;
    
    setGhostVisualizations(prev => 
      prev.map(ghost => 
        ghost.id === ghostId 
          ? { ...ghost, rating, isVisible: true }
          : ghost
      )
    );
  };

  // Remove ghost visualization
  const removeGhostVisualization = (location: Location) => {
    const ghostId = `ghost-${location.coordinates.latitude}-${location.coordinates.longitude}`;
    
    setGhostVisualizations(prev => 
      prev.map(ghost => 
        ghost.id === ghostId 
          ? { ...ghost, isVisible: false }
          : ghost
      )
    );

    // Remove after animation completes
    setTimeout(() => {
      setGhostVisualizations(prev => 
        prev.filter(ghost => ghost.id !== ghostId)
      );
    }, 1000);
  };

  // Clear all ghost visualizations
  const clearAllGhostVisualizations = () => {
    setGhostVisualizations(prev => 
      prev.map(ghost => ({ ...ghost, isVisible: false }))
    );

    setTimeout(() => {
      setGhostVisualizations([]);
    }, 1000);
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    if (comparisonMode) {
      clearComparisonMarkers();
      // Clear comparison ghost visualizations but keep current location ghost
      setGhostVisualizations(prev => 
        prev.filter(ghost => 
          currentLocation && 
          ghost.id === `ghost-${currentLocation.coordinates.latitude}-${currentLocation.coordinates.longitude}`
        )
      );
    }
    setComparisonMode(!comparisonMode);
  };

  // Fit map to show all selected locations
  const fitToSelectedLocations = () => {
    if (!map.current || selectedLocations.length === 0) return;

    const coordinates = selectedLocations.map(loc => [
      loc.coordinates.longitude,
      loc.coordinates.latitude
    ]);

    // Add current location if it exists
    if (currentLocation) {
      coordinates.push([
        currentLocation.coordinates.longitude,
        currentLocation.coordinates.latitude
      ]);
    }

    if (coordinates.length === 1) {
      // Single location - just center on it
      animateToLocation({
        latitude: coordinates[0][1],
        longitude: coordinates[0][0]
      });
    } else if (coordinates.length > 1) {
      // Multiple locations - fit bounds
      if (mapboxgl && mapboxgl.LngLatBounds) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as any);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1500
        });
      }


    }
  };

  // Get rating color based on score
  const getRatingColor = (score: number): string => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-blue-400';
    return 'text-gray-400';
  };

  // Format location name for display
  const formatLocationName = (location: Location): string => {
    if (location.name.length > 25) {
      return location.name.substring(0, 25) + '...';
    }
    return location.name;
  };

  // Keyboard shortcuts for quick access
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault();
            setShowHistory(!showHistory);
            break;
          case 'c':
            event.preventDefault();
            if (locationHistory.length > 0) {
              toggleComparisonMode();
            }
            break;
          case 'g':
            event.preventDefault();
            // Toggle ghost visualizations
            if (ghostVisualizations.length > 0) {
              const allVisible = ghostVisualizations.every(ghost => ghost.isVisible);
              setGhostVisualizations(prev => 
                prev.map(ghost => ({ ...ghost, isVisible: !allVisible }))
              );
            }
            break;
          case 'Escape':
            if (comparisonMode) {
              toggleComparisonMode();
            }
            break;
        }
      }
      
      // Number keys for quick access to recent locations
      if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.metaKey) {
        const index = parseInt(event.key) - 1;
        if (locationHistory[index] && !comparisonMode) {
          event.preventDefault();
          handleQuickAccess(locationHistory[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showHistory, comparisonMode, locationHistory, ghostVisualizations]);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        // Dynamically import Mapbox GL JS
        if (!mapboxgl) {
          const mapboxModule = await import('mapbox-gl');
          mapboxgl = mapboxModule.default;
          
          // Import CSS
          await import('mapbox-gl/dist/mapbox-gl.css');
        }

        // Set access token
        const accessToken = (import.meta.env as any).VITE_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          setError('Mapbox access token is not configured. Please check your environment variables.');
          return;
        }
        
        mapboxgl.accessToken = accessToken;

        // Initialize the map with dark theme
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark theme
          center: [-74.006, 40.7128], // Default to NYC
          zoom: 2,
          pitch: 0,
          bearing: 0,
          antialias: true,
          attributionControl: false, // Minimal UI
          logoPosition: 'bottom-right'
        });

        // Add navigation controls with minimal styling
        const nav = new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true,
          visualizePitch: false
        });
        map.current.addControl(nav, 'top-right');

        // Handle map load event
        map.current.on('load', () => {
          setIsMapLoaded(true);
          console.log('Map loaded successfully');
        });

        // Handle map click events for location selection
        map.current.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          onLocationSelect({
            latitude: lat,
            longitude: lng
          });
        });

        // Handle map errors
        map.current.on('error', (e: any) => {
          console.error('Map error:', e);
          setError('Map failed to load. Please check your internet connection.');
        });

        // Change cursor on hover
        map.current.on('mouseenter', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'crosshair';
          }
        });

        map.current.on('mouseleave', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setError('Failed to initialize map. Please refresh the page.');
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
      }
      // Clear all ghost visualizations
      setGhostVisualizations([]);
    };
  }, [onLocationSelect, setError]);

  // Handle location changes with enhanced animations
  useEffect(() => {
    if (!map.current || !isMapLoaded || !currentLocation) return;

    const { latitude, longitude } = currentLocation.coordinates;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.location-marker, .pulsing-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Calculate marker intensity based on haunted rating
    const intensity = hauntedRating ? hauntedRating.overallScore / 100 : 0.5;
    
    // Create enhanced pulsing marker
    const markerElement = createPulsingMarker(intensity);
    markerElement.classList.add('location-marker');

    // Add marker to map with animation
    if (mapboxgl) {
      new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }

    // Add or update ghost visualization for current location
    if (hauntedRating) {
      addGhostVisualization(currentLocation, hauntedRating);
    }

    // Animate to location with spinning globe effect
    animateToLocation({ latitude, longitude });

  }, [currentLocation, hauntedRating, isMapLoaded]);

  // Handle real-time ghost updates when ratings change
  useEffect(() => {
    if (currentLocation && hauntedRating) {
      updateGhostVisualization(currentLocation, hauntedRating);
    }
  }, [hauntedRating]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Ghost Visualizations */}
      {isMapLoaded && ghostVisualizations.map((ghost) => {
        const intensity = ghost.rating.overallScore / 100;
        const animationType = intensity > 0.7 ? 'drift' : intensity > 0.4 ? 'float' : 'fade';
        
        return (
          <GhostVisualization
            key={ghost.id}
            intensity={intensity}
            position={ghost.location.coordinates}
            animationType={animationType}
            isVisible={ghost.isVisible}
            onAnimationComplete={() => {
              // Optional: Handle animation completion
              console.log(`Ghost animation completed for ${ghost.location.name}`);
            }}
          />
        );
      })}
      
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto mb-2"></div>
            <p className="text-purple-300 text-sm font-medium">Traveling to location...</p>
          </div>
        </div>
      )}

      {/* Map instructions overlay */}
      {isMapLoaded && !currentLocation && (
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm">
            Click anywhere on the map to assess that location's haunted rating
          </p>
        </div>
      )}

      {/* Current location info */}
      {currentLocation && (
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{currentLocation.name}</p>
          <p className="text-xs text-gray-300">{currentLocation.address}</p>
          <p className="text-xs text-gray-400 mt-1">
            {currentLocation.coordinates.latitude.toFixed(4)}, {currentLocation.coordinates.longitude.toFixed(4)}
          </p>
        </div>
      )}

      {/* Haunted rating overlay */}
      {hauntedRating && (
        <div className="absolute top-4 right-4 bg-purple-900 bg-opacity-90 text-white p-3 rounded-lg shadow-lg">
          <div className="text-center">
            <p className="text-xs text-purple-300 uppercase tracking-wide">Haunted Rating</p>
            <p className="text-2xl font-bold text-purple-100">{hauntedRating.overallScore}</p>
            <p className="text-xs text-purple-300">out of 100</p>
            
            {/* Ghost activity indicator */}
            {ghostVisualizations.some(ghost => ghost.isVisible) && (
              <div className="mt-2 flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-300">Ghosts Active</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location History Panel */}
      <div className={`absolute top-4 left-4 bg-gray-800 bg-opacity-95 text-white rounded-lg shadow-lg transition-all duration-300 ${
        showHistory ? 'w-80' : 'w-auto'
      }`}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors"
              title="Toggle location history (Ctrl+H)"
            >
              <span className="text-lg">📍</span>
              <span className="text-sm font-medium">
                {showHistory ? 'Hide History' : `History (${locationHistory.length})`}
              </span>
            </button>
            
            {showHistory && locationHistory.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={toggleComparisonMode}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    comparisonMode 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {comparisonMode ? 'Exit Compare' : 'Compare'}
                </button>
                
                {selectedLocations.length > 0 && (
                  <button
                    onClick={fitToSelectedLocations}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                  >
                    View All ({selectedLocations.length + (currentLocation ? 1 : 0)})
                  </button>
                )}
              </div>
            )}
          </div>

          {showHistory && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              {locationHistory.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No locations visited yet
                </p>
              ) : (
                <div className="space-y-2">
                  {locationHistory.map((location, index) => (
                    <div
                      key={`${location.coordinates.latitude}-${location.coordinates.longitude}-${index}`}
                      className={`p-2 rounded cursor-pointer transition-colors border ${
                        comparisonMode && selectedLocations.includes(location)
                          ? 'bg-purple-700 border-purple-500'
                          : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                      }`}
                      onClick={() => handleQuickAccess(location)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {formatLocationName(location)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {location.address}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {location.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">
                              {location.coordinates.latitude.toFixed(3)}, {location.coordinates.longitude.toFixed(3)}
                            </span>
                          </div>
                        </div>
                        
                        {comparisonMode && (
                          <div className="ml-2">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              selectedLocations.includes(location)
                                ? 'bg-purple-500 border-purple-400'
                                : 'border-gray-400'
                            }`}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {comparisonMode && selectedLocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearComparisonMarkers}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {showHistory && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                💡 Press 1-9 for quick access, Ctrl+H to toggle, Ctrl+C to compare, Ctrl+G for ghosts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && isMapLoaded && (
        <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-75 text-white p-2 rounded text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${fps >= 50 ? 'bg-green-400' : fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <span>{fps} FPS</span>
            {isAnimating && <span className="text-purple-300">Animating</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapInterface;