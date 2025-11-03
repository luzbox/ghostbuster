export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
}

export const parseError = (error: any): ErrorInfo => {
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }
  
  if (error && typeof error === 'object') {
    return {
      message: error.message || 'Unknown error',
      code: error.code,
      status: error.status
    };
  }
  
  return { message: 'Unknown error occurred' };
};

export const logError = (error: any, context?: string) => {
  const errorInfo = parseError(error);
  console.error(`[${context || 'Error'}]:`, errorInfo);
};

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  errorHandler?: (error: any) => void
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          if (errorHandler) {
            errorHandler(error);
          } else {
            logError(error, fn.name);
          }
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        logError(error, fn.name);
      }
      throw error;
    }
  }) as T;
};