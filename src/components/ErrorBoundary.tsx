import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-ghost-950 text-ghost-100 flex items-center justify-center p-4 safe-top safe-bottom">
          <div className="text-center p-6 sm:p-8 max-w-sm sm:max-w-md w-full">
            <div className="text-4xl sm:text-6xl mb-4" role="img" aria-label="Ghost">👻</div>
            <h1 className="text-xl sm:text-2xl font-bold text-haunted-400 mb-4">
              Something Spooky Happened
            </h1>
            <p className="text-ghost-300 mb-6 text-sm sm:text-base leading-relaxed">
              The app encountered an unexpected error. Please refresh the page to try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-haunted-600 hover:bg-haunted-700 focus:bg-haunted-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-haunted-500 touch-target"
                type="button"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full sm:w-auto bg-ghost-800 hover:bg-ghost-700 focus:bg-ghost-700 text-ghost-200 px-6 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ghost-500 touch-target ml-0 sm:ml-3"
                type="button"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-ghost-400 hover:text-ghost-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ghost-500 rounded p-1">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-ghost-500 overflow-auto bg-ghost-900 p-3 rounded border border-ghost-700 max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}