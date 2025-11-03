import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-simple.tsx'
import './index.css'

// Performance and testing utilities (temporarily disabled)
// import { PerformanceMonitor, observeWebVitals } from './utils/performance'
// import { runDevelopmentTests } from './utils/testing'

// Initialize performance monitoring (temporarily disabled)
// const monitor = PerformanceMonitor.getInstance()
// monitor.startTimer('app_initialization')

// Start observing web vitals
// observeWebVitals()

// Run development tests
// if (import.meta.env.DEV) {
//   runDevelopmentTests().catch(console.error)
// }

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Log initialization time (temporarily disabled)
// monitor.endTimer('app_initialization')

// Performance logging in development
// if (import.meta.env.DEV) {
//   // Log performance metrics after initial render
//   setTimeout(() => {
//     monitor.logSummary()
//   }, 1000)
//   
//   // Expose performance utilities globally for debugging
//   ;(window as any).ghostbusterPerf = {
//     monitor,
//     clearMetrics: () => monitor.clearMetrics(),
//     getMetrics: () => monitor.getMetrics()
//   }
// }