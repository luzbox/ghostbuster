import { useState } from 'react'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">👻 Ghostbuster WebApp</h1>
          <p className="text-xl text-gray-300">
            A React-based web application for detecting and rating haunted locations
          </p>
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">🚀 Coming Soon</h2>
            <p className="text-gray-300 mb-4">
              We're working hard to bring you the ultimate haunted location rating system. 
              Features will include:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>🗺️ Interactive dark-themed map interface</li>
              <li>👻 Real-time haunted rating calculations</li>
              <li>🌙 Atmospheric ghost visualizations</li>
              <li>📱 Responsive design with smooth animations</li>
              <li>🔍 Location search and exploration</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">🛠️ Tech Stack</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Frontend:</strong>
                <ul className="text-gray-300 mt-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• Vite</li>
                  <li>• Tailwind CSS</li>
                  <li>• Framer Motion</li>
                </ul>
              </div>
              <div>
                <strong>Backend:</strong>
                <ul className="text-gray-300 mt-1">
                  <li>• Node.js + Express</li>
                  <li>• TypeScript</li>
                  <li>• Environmental APIs</li>
                  <li>• Real-time calculations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Ghost Counter: {count} 👻
            </button>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500">
          <p>Built with React + Vite + TypeScript</p>
        </footer>
      </div>
    </div>
  )
}

export default App