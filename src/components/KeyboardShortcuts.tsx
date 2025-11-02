import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardShortcut {
  key: string;
  description: string;
  modifiers?: string[];
}

const shortcuts: KeyboardShortcut[] = [
  { key: '/', description: 'Focus search input' },
  { key: 'Escape', description: 'Close dialogs/clear focus' },
  { key: '1-9', description: 'Quick access to recent locations' },
  { key: 'h', description: 'Toggle location history', modifiers: ['Ctrl'] },
  { key: 'c', description: 'Toggle comparison mode', modifiers: ['Ctrl'] },
  { key: 'g', description: 'Toggle ghost visualizations', modifiers: ['Ctrl'] },
  { key: '?', description: 'Show keyboard shortcuts', modifiers: ['Shift'] },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts with Shift + ?
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        setIsVisible(true);
      }
      
      // Hide shortcuts with Escape
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // const formatModifiers = (modifiers?: string[]) => {
  //   if (!modifiers || modifiers.length === 0) return '';
  //   return modifiers.join(' + ') + ' + ';
  // };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsVisible(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-96 sm:max-w-lg bg-ghost-900 rounded-lg border border-ghost-700 shadow-xl z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="shortcuts-title" className="text-lg sm:text-xl font-bold text-ghost-200">
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-ghost-400 hover:text-ghost-300 focus:text-ghost-300 transition-colors focus:outline-none focus:ring-2 focus:ring-haunted-500 rounded p-1"
                  aria-label="Close shortcuts dialog"
                  type="button"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded bg-ghost-800/50 hover:bg-ghost-800 transition-colors"
                  >
                    <span className="text-ghost-300 text-sm flex-1 min-w-0">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1 ml-3">
                      {shortcut.modifiers?.map((modifier, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-ghost-700 text-ghost-200 rounded border border-ghost-600">
                            {modifier}
                          </kbd>
                          <span className="text-ghost-500 text-xs">+</span>
                        </React.Fragment>
                      ))}
                      <kbd className="px-2 py-1 text-xs font-mono bg-ghost-700 text-ghost-200 rounded border border-ghost-600">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-ghost-800">
                <p className="text-xs text-ghost-500 text-center">
                  Press <kbd className="px-1 py-0.5 bg-ghost-700 rounded text-ghost-300">Shift + ?</kbd> to toggle this dialog
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search input with '/'
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        const searchInput = document.getElementById('location-search');
        if (searchInput && document.activeElement !== searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }
      
      // Clear focus with Escape
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};