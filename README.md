# Ghostbuster Webapp

A web application that provides users with a "haunted rating" for any location based on multiple environmental and contextual factors.

## Features

- 🗺️ Interactive dark-themed map interface
- 👻 Real-time haunted rating calculations
- 🌙 Atmospheric ghost visualizations
- 📱 Responsive design with smooth animations
- 🔍 Location search and exploration

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom dark theme
- **Mapping**: Mapbox GL JS
- **Animations**: Framer Motion
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── services/       # API calls and external services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
├── App.tsx         # Main application component
├── main.tsx        # React entry point
└── index.css       # Global styles with Tailwind
```

## Development

The project uses:
- Vite for fast development and building
- TypeScript for type safety
- Tailwind CSS for styling with a custom dark theme
- ESLint for code linting

## License

MIT