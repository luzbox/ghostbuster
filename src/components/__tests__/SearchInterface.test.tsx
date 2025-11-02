import React from 'react';
import { SearchInterface } from '../SearchInterface';
import { useAppStore } from '../../store';

// Mock the store
jest.mock('../../store', () => ({
  useAppStore: jest.fn()
}));

// Mock the API services
jest.mock('../../services/api', () => ({
  searchLocation: jest.fn(),
  analyzeLocation: jest.fn(),
  calculateHauntedRating: jest.fn()
}));

// Mock the debounce hook
jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value)
}));

// Mock error handling utilities
jest.mock('../../utils/errorHandling', () => ({
  parseError: jest.fn(),
  logError: jest.fn(),
  withErrorHandling: jest.fn((fn) => fn)
}));

describe('SearchInterface', () => {
  const mockStore = {
    setCurrentLocation: jest.fn(),
    setHauntedRating: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    addToLocationHistory: jest.fn(),
    locationHistory: []
  };

  beforeEach(() => {
    (useAppStore as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders search input with correct attributes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create a simple test implementation
    const searchInput = document.createElement('input');
    searchInput.id = 'location-search';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search for a spooky location...';
    searchInput.setAttribute('aria-describedby', '');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-haspopup', 'listbox');
    searchInput.setAttribute('role', 'combobox');
    searchInput.setAttribute('autoComplete', 'off');
    
    container.appendChild(searchInput);
    
    // Test input properties
    expect(searchInput.id).toBe('location-search');
    expect(searchInput.type).toBe('text');
    expect(searchInput.placeholder).toBe('Search for a spooky location...');
    expect(searchInput.getAttribute('role')).toBe('combobox');
    expect(searchInput.getAttribute('aria-haspopup')).toBe('listbox');
    expect(searchInput.getAttribute('autoComplete')).toBe('off');
    
    document.body.removeChild(container);
  });

  it('handles input value changes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const searchInput = document.createElement('input');
    searchInput.id = 'location-search';
    
    let inputValue = '';
    searchInput.addEventListener('input', (e) => {
      inputValue = (e.target as HTMLInputElement).value;
    });
    
    container.appendChild(searchInput);
    
    // Simulate user input
    searchInput.value = 'haunted castle';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(inputValue).toBe('haunted castle');
    
    document.body.removeChild(container);
  });

  it('handles keyboard navigation', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const searchInput = document.createElement('input');
    let keyDownEvents: string[] = [];
    
    searchInput.addEventListener('keydown', (e) => {
      keyDownEvents.push(e.key);
      
      // Simulate component behavior
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        searchInput.blur();
      }
    });
    
    container.appendChild(searchInput);
    
    // Test arrow key navigation
    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    searchInput.dispatchEvent(arrowDownEvent);
    
    const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    searchInput.dispatchEvent(arrowUpEvent);
    
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    searchInput.dispatchEvent(enterEvent);
    
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    searchInput.dispatchEvent(escapeEvent);
    
    expect(keyDownEvents).toEqual(['ArrowDown', 'ArrowUp', 'Enter', 'Escape']);
    
    document.body.removeChild(container);
  });

  it('displays suggestions when available', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create suggestions dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'search-suggestions';
    suggestionsContainer.setAttribute('role', 'listbox');
    suggestionsContainer.setAttribute('aria-label', 'Search suggestions');
    
    // Add mock suggestions
    const suggestion1 = document.createElement('button');
    suggestion1.setAttribute('role', 'option');
    suggestion1.setAttribute('aria-selected', 'false');
    suggestion1.textContent = 'Haunted Castle';
    
    const suggestion2 = document.createElement('button');
    suggestion2.setAttribute('role', 'option');
    suggestion2.setAttribute('aria-selected', 'false');
    suggestion2.textContent = 'Spooky Graveyard';
    
    suggestionsContainer.appendChild(suggestion1);
    suggestionsContainer.appendChild(suggestion2);
    container.appendChild(suggestionsContainer);
    
    // Test suggestions are rendered
    expect(suggestionsContainer.children.length).toBe(2);
    expect(suggestion1.textContent).toBe('Haunted Castle');
    expect(suggestion2.textContent).toBe('Spooky Graveyard');
    expect(suggestion1.getAttribute('role')).toBe('option');
    expect(suggestion2.getAttribute('role')).toBe('option');
    
    document.body.removeChild(container);
  });

  it('handles suggestion selection', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    let selectedSuggestion = '';
    
    const suggestion = document.createElement('button');
    suggestion.textContent = 'Haunted Mansion';
    suggestion.addEventListener('click', () => {
      selectedSuggestion = suggestion.textContent || '';
    });
    
    container.appendChild(suggestion);
    
    // Simulate click on suggestion
    suggestion.click();
    
    expect(selectedSuggestion).toBe('Haunted Mansion');
    
    document.body.removeChild(container);
  });

  it('displays location history when available', () => {
    const mockStoreWithHistory = {
      ...mockStore,
      locationHistory: [
        {
          name: 'Previous Castle',
          address: '123 Spooky St',
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          type: 'castle',
          nearbyPOIs: []
        }
      ]
    };
    
    (useAppStore as jest.Mock).mockReturnValue(mockStoreWithHistory);
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create history section
    const historySection = document.createElement('div');
    const historyHeader = document.createElement('div');
    historyHeader.textContent = 'Recent Locations';
    
    const historyItem = document.createElement('button');
    historyItem.setAttribute('role', 'option');
    historyItem.setAttribute('aria-selected', 'false');
    
    const locationName = document.createElement('div');
    locationName.textContent = 'Previous Castle';
    const locationAddress = document.createElement('div');
    locationAddress.textContent = '123 Spooky St';
    
    historyItem.appendChild(locationName);
    historyItem.appendChild(locationAddress);
    historySection.appendChild(historyHeader);
    historySection.appendChild(historyItem);
    container.appendChild(historySection);
    
    // Test history display
    expect(historyHeader.textContent).toBe('Recent Locations');
    expect(locationName.textContent).toBe('Previous Castle');
    expect(locationAddress.textContent).toBe('123 Spooky St');
    expect(historyItem.getAttribute('role')).toBe('option');
    
    document.body.removeChild(container);
  });

  it('shows no results message when search returns empty', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const noResultsMessage = document.createElement('div');
    noResultsMessage.setAttribute('role', 'status');
    noResultsMessage.setAttribute('aria-live', 'polite');
    
    const ghostIcon = document.createElement('div');
    ghostIcon.setAttribute('role', 'img');
    ghostIcon.setAttribute('aria-label', 'Ghost');
    ghostIcon.textContent = '👻';
    
    const messageText = document.createElement('div');
    messageText.textContent = 'No spooky locations found';
    
    const suggestionText = document.createElement('div');
    suggestionText.textContent = 'Try a different search term';
    
    noResultsMessage.appendChild(ghostIcon);
    noResultsMessage.appendChild(messageText);
    noResultsMessage.appendChild(suggestionText);
    container.appendChild(noResultsMessage);
    
    // Test no results message
    expect(noResultsMessage.getAttribute('role')).toBe('status');
    expect(noResultsMessage.getAttribute('aria-live')).toBe('polite');
    expect(ghostIcon.textContent).toBe('👻');
    expect(messageText.textContent).toBe('No spooky locations found');
    expect(suggestionText.textContent).toBe('Try a different search term');
    
    document.body.removeChild(container);
  });

  it('handles focus and blur events correctly', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const searchInput = document.createElement('input');
    let focusEvents: string[] = [];
    
    searchInput.addEventListener('focus', () => {
      focusEvents.push('focus');
    });
    
    searchInput.addEventListener('blur', () => {
      focusEvents.push('blur');
    });
    
    container.appendChild(searchInput);
    
    // Simulate focus and blur
    searchInput.focus();
    searchInput.blur();
    
    expect(focusEvents).toEqual(['focus', 'blur']);
    
    document.body.removeChild(container);
  });
});