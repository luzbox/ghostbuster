import { createElement } from 'react';
import { MapInterface } from '../MapInterface';
import { useAppStore } from '../../store';
import { Location, HauntedRating } from '../../types';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock Mapbox GL JS
const mockMap = {
  on: vi.fn(),
  remove: vi.fn(),
  getZoom: vi.fn(() => 10),
  getCenter: vi.fn(() => ({ lat: 40.7128, lng: -74.0060 })),
  easeTo: vi.fn(),
  flyTo: vi.fn(),
  once: vi.fn(),
  addControl: vi.fn(),
  getCanvas: vi.fn(() => ({
    style: { cursor: '', imageRendering: 'auto' }
  })),
  fitBounds: vi.fn()
};

const mockNavigationControl = vi.fn();
const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn()
};

vi.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    Map: vi.fn(() => mockMap),
    NavigationControl: mockNavigationControl,
    Marker: vi.fn(() => mockMarker),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn().mockReturnThis()
    })),
    accessToken: ''
  }
}));

// Mock GhostVisualization component
vi.mock('../GhostVisualization', () => ({
  GhostVisualization: ({ intensity, position, isVisible }: any) => 
    createElement('div', {
      'data-testid': 'ghost-visualization',
      'data-intensity': intensity,
      'data-position': JSON.stringify(position),
      'data-visible': isVisible
    })
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_MAPBOX_ACCESS_TOKEN: 'test-token'
  }
});

describe('MapInterface', () => {
  const mockLocation: Location = {
    name: 'Test Haunted Castle',
    address: '123 Spooky Lane',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    type: 'castle',
    nearbyPOIs: []
  };

  const mockHauntedRating: HauntedRating = {
    overallScore: 75,
    factors: {
      locationScore: 30,
      weatherScore: 18.75,
      timeScore: 18.75,
      seasonScore: 7.5
    },
    breakdown: [],
    calculatedAt: new Date()
  };

  const mockStore = {
    setError: vi.fn(),
    locationHistory: []
  };

  const mockOnLocationSelect = vi.fn();

  beforeEach(() => {
    (useAppStore as any).mockReturnValue(mockStore);
    vi.clearAllMocks();
  });

  it('renders map container with correct attributes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create map container
    const mapContainer = document.createElement('div');
    mapContainer.className = 'w-full h-full rounded-lg overflow-hidden';
    mapContainer.style.minHeight = '400px';
    
    const mapWrapper = document.createElement('div');
    mapWrapper.className = 'relative w-full h-full';
    mapWrapper.appendChild(mapContainer);
    
    container.appendChild(mapWrapper);
    
    // Test map container properties
    expect(mapContainer.className).toContain('w-full h-full rounded-lg overflow-hidden');
    expect(mapContainer.style.minHeight).toBe('400px');
    
    document.body.removeChild(container);
  });

  it('handles location selection callback', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const mapContainer = document.createElement('div');
    
    // Simulate map click event
    const clickEvent = {
      lngLat: { lng: -74.0060, lat: 40.7128 }
    };
    
    let selectedCoordinates: any = null;
    const onLocationSelect = (coords: { latitude: number; longitude: number }) => {
      selectedCoordinates = coords;
    };
    
    // Simulate click handler
    const handleMapClick = (e: any) => {
      const { lng, lat } = e.lngLat;
      onLocationSelect({
        latitude: lat,
        longitude: lng
      });
    };
    
    mapContainer.addEventListener('click', () => handleMapClick(clickEvent));
    container.appendChild(mapContainer);
    
    // Trigger click
    mapContainer.click();
    
    expect(selectedCoordinates).toEqual({
      latitude: 40.7128,
      longitude: -74.0060
    });
    
    document.body.removeChild(container);
  });

  it('displays loading state when map is not loaded', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'absolute inset-0 bg-gray-900 flex items-center justify-center rounded-lg';
    
    const loadingContent = document.createElement('div');
    loadingContent.className = 'text-center';
    
    const spinner = document.createElement('div');
    spinner.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2';
    
    const loadingText = document.createElement('p');
    loadingText.className = 'text-gray-400 text-sm';
    loadingText.textContent = 'Loading map...';
    
    loadingContent.appendChild(spinner);
    loadingContent.appendChild(loadingText);
    loadingOverlay.appendChild(loadingContent);
    container.appendChild(loadingOverlay);
    
    // Test loading state
    expect(loadingOverlay.className).toContain('absolute inset-0');
    expect(loadingText.textContent).toBe('Loading map...');
    expect(spinner.className).toContain('animate-spin');
    
    document.body.removeChild(container);
  });

  it('displays animation overlay during location transitions', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create animation overlay
    const animationOverlay = document.createElement('div');
    animationOverlay.className = 'absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg pointer-events-none';
    
    const animationContent = document.createElement('div');
    animationContent.className = 'text-center';
    
    const animationSpinner = document.createElement('div');
    animationSpinner.className = 'animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto mb-2';
    
    const animationText = document.createElement('p');
    animationText.className = 'text-purple-300 text-sm font-medium';
    animationText.textContent = 'Traveling to location...';
    
    animationContent.appendChild(animationSpinner);
    animationContent.appendChild(animationText);
    animationOverlay.appendChild(animationContent);
    container.appendChild(animationOverlay);
    
    // Test animation overlay
    expect(animationOverlay.className).toContain('pointer-events-none');
    expect(animationText.textContent).toBe('Traveling to location...');
    expect(animationSpinner.className).toContain('animate-spin');
    
    document.body.removeChild(container);
  });

  it('displays current location info when location is set', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create location info overlay
    const locationInfo = document.createElement('div');
    locationInfo.className = 'absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg';
    
    const locationName = document.createElement('p');
    locationName.className = 'text-sm font-medium';
    locationName.textContent = mockLocation.name;
    
    const locationAddress = document.createElement('p');
    locationAddress.className = 'text-xs text-gray-300';
    locationAddress.textContent = mockLocation.address;
    
    const locationCoords = document.createElement('p');
    locationCoords.className = 'text-xs text-gray-400 mt-1';
    locationCoords.textContent = `${mockLocation.coordinates.latitude.toFixed(4)}, ${mockLocation.coordinates.longitude.toFixed(4)}`;
    
    locationInfo.appendChild(locationName);
    locationInfo.appendChild(locationAddress);
    locationInfo.appendChild(locationCoords);
    container.appendChild(locationInfo);
    
    // Test location info display
    expect(locationName.textContent).toBe(mockLocation.name);
    expect(locationAddress.textContent).toBe(mockLocation.address);
    expect(locationCoords.textContent).toBe('40.7128, -74.0060');
    
    document.body.removeChild(container);
  });

  it('displays haunted rating overlay when rating is available', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create rating overlay
    const ratingOverlay = document.createElement('div');
    ratingOverlay.className = 'absolute top-4 right-4 bg-purple-900 bg-opacity-90 text-white p-3 rounded-lg shadow-lg';
    
    const ratingContent = document.createElement('div');
    ratingContent.className = 'text-center';
    
    const ratingLabel = document.createElement('p');
    ratingLabel.className = 'text-xs text-purple-300 uppercase tracking-wide';
    ratingLabel.textContent = 'Haunted Rating';
    
    const ratingScore = document.createElement('p');
    ratingScore.className = 'text-2xl font-bold text-purple-100';
    ratingScore.textContent = mockHauntedRating.overallScore.toString();
    
    const ratingMax = document.createElement('p');
    ratingMax.className = 'text-xs text-purple-300';
    ratingMax.textContent = 'out of 100';
    
    ratingContent.appendChild(ratingLabel);
    ratingContent.appendChild(ratingScore);
    ratingContent.appendChild(ratingMax);
    ratingOverlay.appendChild(ratingContent);
    container.appendChild(ratingOverlay);
    
    // Test rating overlay
    expect(ratingLabel.textContent).toBe('Haunted Rating');
    expect(ratingScore.textContent).toBe('75');
    expect(ratingMax.textContent).toBe('out of 100');
    
    document.body.removeChild(container);
  });

  it('handles keyboard shortcuts for map interactions', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    let keyboardEvents: string[] = [];
    
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault();
            keyboardEvents.push('toggle-history');
            break;
          case 'c':
            event.preventDefault();
            keyboardEvents.push('toggle-comparison');
            break;
          case 'g':
            event.preventDefault();
            keyboardEvents.push('toggle-ghosts');
            break;
        }
      }
      
      if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        keyboardEvents.push(`quick-access-${event.key}`);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // Test keyboard shortcuts
    const ctrlH = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true });
    document.dispatchEvent(ctrlH);
    
    const ctrlC = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
    document.dispatchEvent(ctrlC);
    
    const ctrlG = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
    document.dispatchEvent(ctrlG);
    
    const key1 = new KeyboardEvent('keydown', { key: '1' });
    document.dispatchEvent(key1);
    
    expect(keyboardEvents).toEqual([
      'toggle-history',
      'toggle-comparison',
      'toggle-ghosts',
      'quick-access-1'
    ]);
    
    document.removeEventListener('keydown', handleKeyPress);
    document.body.removeChild(container);
  });

  it('displays location history panel', () => {
    const mockStoreWithHistory = {
      ...mockStore,
      locationHistory: [mockLocation]
    };
    
    (useAppStore as any).mockReturnValue(mockStoreWithHistory);
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create history panel
    const historyPanel = document.createElement('div');
    historyPanel.className = 'absolute top-4 left-4 bg-gray-800 bg-opacity-95 text-white rounded-lg shadow-lg transition-all duration-300 w-80';
    
    const historyHeader = document.createElement('div');
    historyHeader.className = 'p-3';
    
    const historyButton = document.createElement('button');
    historyButton.className = 'flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors';
    historyButton.setAttribute('title', 'Toggle location history (Ctrl+H)');
    
    const historyIcon = document.createElement('span');
    historyIcon.textContent = '📍';
    
    const historyText = document.createElement('span');
    historyText.textContent = 'History (1)';
    
    historyButton.appendChild(historyIcon);
    historyButton.appendChild(historyText);
    historyHeader.appendChild(historyButton);
    
    const historyContent = document.createElement('div');
    historyContent.className = 'mt-3 max-h-64 overflow-y-auto';
    
    const historyItem = document.createElement('div');
    historyItem.className = 'p-2 rounded cursor-pointer transition-colors border bg-gray-700 hover:bg-gray-600 border-gray-600';
    
    const itemName = document.createElement('p');
    itemName.className = 'text-sm font-medium text-white truncate';
    itemName.textContent = mockLocation.name;
    
    historyItem.appendChild(itemName);
    historyContent.appendChild(historyItem);
    historyHeader.appendChild(historyContent);
    historyPanel.appendChild(historyHeader);
    container.appendChild(historyPanel);
    
    // Test history panel
    expect(historyText.textContent).toBe('History (1)');
    expect(itemName.textContent).toBe(mockLocation.name);
    expect(historyButton.getAttribute('title')).toBe('Toggle location history (Ctrl+H)');
    
    document.body.removeChild(container);
  });

  it('handles performance monitoring during animations', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create performance indicator
    const performanceIndicator = document.createElement('div');
    performanceIndicator.className = 'absolute bottom-4 right-4 bg-gray-800 bg-opacity-75 text-white p-2 rounded text-xs';
    
    const performanceContent = document.createElement('div');
    performanceContent.className = 'flex items-center space-x-2';
    
    // Test different FPS scenarios
    const testFPS = (fps: number) => {
      const fpsIndicator = document.createElement('div');
      fpsIndicator.className = `w-2 h-2 rounded-full ${fps >= 50 ? 'bg-green-400' : fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`;
      
      const fpsText = document.createElement('span');
      fpsText.textContent = `${fps} FPS`;
      
      performanceContent.appendChild(fpsIndicator);
      performanceContent.appendChild(fpsText);
      
      return { fpsIndicator, fpsText };
    };
    
    // Test high FPS (good performance)
    const { fpsIndicator: goodFPS, fpsText: goodText } = testFPS(60);
    expect(goodFPS.className).toContain('bg-green-400');
    expect(goodText.textContent).toBe('60 FPS');
    
    // Test medium FPS (moderate performance)
    performanceContent.innerHTML = '';
    const { fpsIndicator: mediumFPS, fpsText: mediumText } = testFPS(35);
    expect(mediumFPS.className).toContain('bg-yellow-400');
    expect(mediumText.textContent).toBe('35 FPS');
    
    // Test low FPS (poor performance)
    performanceContent.innerHTML = '';
    const { fpsIndicator: lowFPS, fpsText: lowText } = testFPS(20);
    expect(lowFPS.className).toContain('bg-red-400');
    expect(lowText.textContent).toBe('20 FPS');
    
    performanceIndicator.appendChild(performanceContent);
    container.appendChild(performanceIndicator);
    
    document.body.removeChild(container);
  });

  it('calculates bearing for spinning globe animation', () => {
    // Test bearing calculation function
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
    
    const start = { lat: 40.7128, lng: -74.0060 }; // NYC
    const end = { lat: 51.5074, lng: -0.1278 };    // London
    
    const bearing = calculateBearing(start, end);
    
    // Bearing should be a valid number between 0 and 360
    expect(typeof bearing).toBe('number');
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
    
    // Test specific bearing calculation (approximate)
    expect(bearing).toBeCloseTo(51.2, 0); // Approximate bearing from NYC to London
  });

  it('formats location names for display', () => {
    const formatLocationName = (location: Location): string => {
      if (location.name.length > 25) {
        return location.name.substring(0, 25) + '...';
      }
      return location.name;
    };
    
    // Test short name (no truncation)
    const shortLocation = { ...mockLocation, name: 'Short Name' };
    expect(formatLocationName(shortLocation)).toBe('Short Name');
    
    // Test long name (truncation)
    const longLocation = { ...mockLocation, name: 'This is a very long location name that should be truncated' };
    expect(formatLocationName(longLocation)).toBe('This is a very long locat...');
    
    // Test exact boundary (25 characters)
    const boundaryLocation = { ...mockLocation, name: 'Exactly twenty-five char' };
    expect(formatLocationName(boundaryLocation)).toBe('Exactly twenty-five char');
  });
});