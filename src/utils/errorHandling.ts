// Comprehensive error handling utilities
import { ApiError } from '../services/api';

export interface ErrorInfo {
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
  technicalDetails?: string;
  suggestions?: string[];
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public retryable: boolean = false,
    public userMessage?: string,
    public technicalDetails?: string,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Parse and categorize different types of errors
 */
export const parseError = (error: unknown): ErrorInfo => {
  // Handle API errors
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      severity: getSeverityFromApiError(error),
      retryable: error.retryable,
      userMessage: getUserMessageFromApiError(error),
      technicalDetails: error.details ? JSON.stringify(error.details, null, 2) : undefined,
      suggestions: getSuggestionsFromApiError(error)
    };
  }

  // Handle App errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      severity: error.severity,
      retryable: error.retryable,
      userMessage: error.userMessage || error.message,
      technicalDetails: error.technicalDetails,
      suggestions: error.suggestions
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network connection failed',
      code: 'NETWORK_ERROR',
      severity: 'high',
      retryable: true,
      userMessage: 'Unable to connect to the server. Please check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    };
  }

  // Handle geolocation errors
  if (error instanceof GeolocationPositionError) {
    return parseGeolocationError(error);
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'GENERIC_ERROR',
      severity: 'medium',
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalDetails: error.stack,
      suggestions: [
        'Refresh the page',
        'Clear your browser cache',
        'Try using a different browser'
      ]
    };
  }

  // Handle unknown errors
  return {
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    severity: 'medium',
    retryable: false,
    userMessage: 'Something went wrong. Please try again.',
    suggestions: [
      'Refresh the page',
      'Try again in a few moments'
    ]
  };
};

/**
 * Get severity level from API error
 */
const getSeverityFromApiError = (error: ApiError): 'low' | 'medium' | 'high' | 'critical' => {
  if (error.code.startsWith('HTTP_5')) return 'high';
  if (error.code === 'HTTP_429') return 'medium';
  if (error.code === 'HTTP_404') return 'low';
  if (error.code === 'NETWORK_ERROR') return 'high';
  return 'medium';
};

/**
 * Get user-friendly message from API error
 */
const getUserMessageFromApiError = (error: ApiError): string => {
  switch (error.code) {
    case 'HTTP_400':
      return 'Invalid request. Please check your input and try again.';
    case 'HTTP_401':
      return 'Authentication required. Please refresh the page.';
    case 'HTTP_403':
      return 'Access denied. You may not have permission for this action.';
    case 'HTTP_404':
      return 'The requested resource was not found.';
    case 'HTTP_429':
      return 'Too many requests. Please wait a moment before trying again.';
    case 'HTTP_500':
    case 'HTTP_502':
    case 'HTTP_503':
    case 'HTTP_504':
      return 'Server error. Please try again in a few moments.';
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return error.message || 'An error occurred while processing your request.';
  }
};

/**
 * Get suggestions from API error
 */
const getSuggestionsFromApiError = (error: ApiError): string[] => {
  switch (error.code) {
    case 'HTTP_400':
      return [
        'Check that you entered a valid location',
        'Try searching for a different location',
        'Make sure your search query is not empty'
      ];
    case 'HTTP_401':
    case 'HTTP_403':
      return [
        'Refresh the page',
        'Clear your browser cache',
        'Try again in a few minutes'
      ];
    case 'HTTP_404':
      return [
        'Try searching for a different location',
        'Check the spelling of your search',
        'Use a more general location name'
      ];
    case 'HTTP_429':
      return [
        'Wait 30 seconds before trying again',
        'Reduce the frequency of your requests',
        'Try again later'
      ];
    case 'HTTP_500':
    case 'HTTP_502':
    case 'HTTP_503':
    case 'HTTP_504':
      return [
        'Wait a few minutes and try again',
        'Check if the service is experiencing issues',
        'Try refreshing the page'
      ];
    case 'NETWORK_ERROR':
      return [
        'Check your internet connection',
        'Try connecting to a different network',
        'Disable VPN if you are using one',
        'Try again in a few moments'
      ];
    default:
      return [
        'Try again in a few moments',
        'Refresh the page if the problem persists'
      ];
  }
};

/**
 * Parse geolocation errors
 */
const parseGeolocationError = (error: GeolocationPositionError): ErrorInfo => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        message: 'Geolocation permission denied',
        code: 'GEOLOCATION_DENIED',
        severity: 'medium',
        retryable: false,
        userMessage: 'Location access was denied. You can still search for locations manually.',
        suggestions: [
          'Enable location permissions in your browser settings',
          'Use the search box to find locations manually',
          'Click on the map to select a location'
        ]
      };
    case error.POSITION_UNAVAILABLE:
      return {
        message: 'Geolocation position unavailable',
        code: 'GEOLOCATION_UNAVAILABLE',
        severity: 'medium',
        retryable: true,
        userMessage: 'Unable to determine your location. Please try again or search manually.',
        suggestions: [
          'Try again in a few moments',
          'Make sure you are not in an area with poor GPS signal',
          'Use the search box to find locations manually'
        ]
      };
    case error.TIMEOUT:
      return {
        message: 'Geolocation request timed out',
        code: 'GEOLOCATION_TIMEOUT',
        severity: 'low',
        retryable: true,
        userMessage: 'Location request timed out. Please try again.',
        suggestions: [
          'Try again with a longer timeout',
          'Make sure you have a stable internet connection',
          'Use the search box to find locations manually'
        ]
      };
    default:
      return {
        message: 'Geolocation error',
        code: 'GEOLOCATION_ERROR',
        severity: 'medium',
        retryable: true,
        userMessage: 'Unable to access your location. Please search manually.',
        suggestions: [
          'Use the search box to find locations',
          'Click on the map to select a location'
        ]
      };
  }
};

/**
 * Log error with appropriate level
 */
export const logError = (error: ErrorInfo, context?: string): void => {
  const logMessage = `[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`;
  const logContext = context ? ` (Context: ${context})` : '';
  
  switch (error.severity) {
    case 'critical':
      console.error(`🚨 ${logMessage}${logContext}`, {
        error,
        technicalDetails: error.technicalDetails,
        timestamp: new Date().toISOString()
      });
      break;
    case 'high':
      console.error(`❌ ${logMessage}${logContext}`, error);
      break;
    case 'medium':
      console.warn(`⚠️ ${logMessage}${logContext}`, error);
      break;
    case 'low':
      console.info(`ℹ️ ${logMessage}${logContext}`, error);
      break;
  }
};

/**
 * Create retry function with exponential backoff
 */
export const createRetryFunction = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  return async (): Promise<T> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorInfo = parseError(error);
        
        // Don't retry if error is not retryable
        if (!errorInfo.retryable) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  onError?: (error: ErrorInfo) => void
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorInfo = parseError(error);
      logError(errorInfo, context);
      
      if (onError) {
        onError(errorInfo);
      }
      
      throw error;
    }
  };
};

/**
 * Create error boundary for React components
 */
export const createErrorBoundary = (
  fallbackComponent: React.ComponentType<{ error: ErrorInfo; retry: () => void }>,
  onError?: (error: ErrorInfo) => void
) => {
  return class extends React.Component<
    { children: React.ReactNode },
    { error: ErrorInfo | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: unknown) {
      return { error: parseError(error) };
    }

    componentDidCatch(error: unknown) {
      const errorInfo = parseError(error);
      logError(errorInfo, 'React Error Boundary');
      
      if (onError) {
        onError(errorInfo);
      }
    }

    render() {
      if (this.state.error) {
        const FallbackComponent = fallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={() => this.setState({ error: null })}
          />
        );
      }

      return this.props.children;
    }
  };
};

/**
 * Format error for display to users
 */
export const formatErrorForUser = (error: ErrorInfo): {
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
} => {
  return {
    title: getErrorTitle(error),
    message: error.userMessage,
    suggestions: error.suggestions || [],
    canRetry: error.retryable
  };
};

/**
 * Get appropriate error title based on error type
 */
const getErrorTitle = (error: ErrorInfo): string => {
  switch (error.severity) {
    case 'critical':
      return 'Critical Error';
    case 'high':
      return 'Connection Error';
    case 'medium':
      return 'Something Went Wrong';
    case 'low':
      return 'Minor Issue';
    default:
      return 'Error';
  }
};