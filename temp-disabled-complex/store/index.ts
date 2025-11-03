import { create } from 'zustand';
import { HauntedRating, Location } from '../types';

interface AppState {
  // Haunted rating state
  hauntedRating: HauntedRating | null;
  isRatingExpanded: boolean;
  
  // Location state
  currentLocation: Location | null;
  locationHistory: Location[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setHauntedRating: (rating: HauntedRating | null) => void;
  toggleRatingExpanded: () => void;
  setCurrentLocation: (location: Location | null) => void;
  addToLocationHistory: (location: Location) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  hauntedRating: null,
  isRatingExpanded: false,
  currentLocation: null,
  locationHistory: [],
  isLoading: false,
  error: null,
  
  // Actions
  setHauntedRating: (rating) => set({ hauntedRating: rating }),
  
  toggleRatingExpanded: () => set((state) => ({ 
    isRatingExpanded: !state.isRatingExpanded 
  })),
  
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  addToLocationHistory: (location) => set((state) => {
    const exists = state.locationHistory.some(
      (loc) => loc.name === location.name && 
               loc.coordinates.latitude === location.coordinates.latitude &&
               loc.coordinates.longitude === location.coordinates.longitude
    );
    
    if (!exists) {
      return {
        locationHistory: [location, ...state.locationHistory].slice(0, 10) // Keep last 10
      };
    }
    return state;
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}));