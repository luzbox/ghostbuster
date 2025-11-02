import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    circle: 'circle',
    path: 'path',
    svg: 'svg',
    span: 'span',
    button: 'button',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  Map: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
  })),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  Popup: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
}))