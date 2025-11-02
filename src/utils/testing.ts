// Testing utilities for the Ghostbuster webapp
import { Location, HauntedRating, EnvironmentalFactors } from '../types';

/**
 * Mock data for testing
 */
export const mockLocation: Location = {
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  name: 'Test Haunted Location',
  address: '123 Spooky Street, Ghost Town, NY 10001',
  type: 'castle' as any,
  nearbyPOIs: []
};

export const mockHauntedRating: HauntedRating = {
  overallScore: 75,
  factors: {
    locationScore: 30,
    weatherScore: 18.75,
    timeScore: 18.75,
    seasonScore: 7.5
  },
  breakdown: [
    {
      factor: 'Location Type',
      weight: 40,
      contribution: 30,
      description: 'Castle locations have high haunted potential'
    },
    {
      factor: 'Weather Conditions',
      weight: 25,
      contribution: 18.75,
      description: 'Foggy weather increases supernatural activity'
    },
    {
      factor: 'Time of Day',
      weight: 25,
      contribution: 18.75,
      description: 'Nighttime hours are peak haunting time'
    },
    {
      factor: 'Season',
      weight: 10,
      contribution: 7.5,
      description: 'Autumn season enhances spooky atmosphere'
    }
  ],
  calculatedAt: new Date()
};

export const mockEnvironmentalFactors: EnvironmentalFactors = {
  weather: {
    condition: 'foggy' as any,
    temperature: 45,
    visibility: 0.5,
    precipitation: false
  },
  time: {
    hour: 23,
    isNighttime: true,
    timezone: 'America/New_York'
  },
  season: 'autumn' as any
};

/**
 * Test suite for core functionality
 */
export class TestSuite {
  private results: { name: string; passed: boolean; error?: string }[] = [];

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.group('🧪 Running Ghostbuster Test Suite');
    
    try {
      await this.testRatingCalculation();
      await this.testLocationValidation();
      await this.testErrorHandling();
      await this.testPerformanceMetrics();
      await this.testCaching();
      
      this.printResults();
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Test rating calculation
   */
  private async testRatingCalculation(): Promise<void> {
    try {
      // Import rating engine
      const { calculateHauntedRating } = await import('./ratingEngine');
      
      const result = calculateHauntedRating(
        mockLocation.type as any,
        mockEnvironmentalFactors.weather.condition as any,
        mockEnvironmentalFactors.time.hour,
        mockEnvironmentalFactors.season as any
      );
      
      this.assert(
        'Rating calculation returns valid score',
        typeof result === 'number' && result >= 0 && result <= 100
      );
      
      this.assert(
        'Rating calculation is deterministic',
        result === calculateHauntedRating(
          mockLocation.type as any,
          mockEnvironmentalFactors.weather.condition as any,
          mockEnvironmentalFactors.time.hour,
          mockEnvironmentalFactors.season as any
        )
      );
      
    } catch (error) {
      this.assert('Rating calculation', false, (error as Error).message);
    }
  }

  /**
   * Test location validation
   */
  private async testLocationValidation(): Promise<void> {
    try {
      const { isValidCoordinates } = await import('./index');
      
      this.assert(
        'Valid coordinates pass validation',
        isValidCoordinates(40.7128, -74.0060)
      );
      
      this.assert(
        'Invalid latitude fails validation',
        !isValidCoordinates(91, -74.0060)
      );
      
      this.assert(
        'Invalid longitude fails validation',
        !isValidCoordinates(40.7128, 181)
      );
      
    } catch (error) {
      this.assert('Location validation', false, (error as Error).message);
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    try {
      const { parseError, AppError } = await import('./errorHandling');
      
      const testError = new AppError(
        'Test error',
        'TEST_ERROR',
        'medium',
        true,
        'User friendly message'
      );
      
      const parsed = parseError(testError);
      
      this.assert(
        'Error parsing returns correct structure',
        parsed.code === 'TEST_ERROR' && 
        parsed.severity === 'medium' && 
        parsed.retryable === true
      );
      
      // Test network error parsing
      const networkError = new TypeError('fetch failed');
      const parsedNetwork = parseError(networkError);
      
      this.assert(
        'Network error is correctly identified',
        parsedNetwork.code === 'NETWORK_ERROR' && parsedNetwork.retryable === true
      );
      
    } catch (error) {
      this.assert('Error handling', false, (error as Error).message);
    }
  }

  /**
   * Test performance metrics
   */
  private async testPerformanceMetrics(): Promise<void> {
    try {
      const { PerformanceMonitor } = await import('./performance');
      
      const monitor = PerformanceMonitor.getInstance();
      
      monitor.startTimer('test_operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = monitor.endTimer('test_operation');
      
      this.assert(
        'Performance monitoring works',
        duration >= 10 && duration < 50
      );
      
      monitor.recordMetric('test_metric', 42);
      
      this.assert(
        'Metric recording works',
        monitor.getMetric('test_metric') === 42
      );
      
    } catch (error) {
      this.assert('Performance metrics', false, (error as Error).message);
    }
  }

  /**
   * Test caching functionality
   */
  private async testCaching(): Promise<void> {
    try {
      // Test if localStorage is available
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('test_cache', 'test_value');
        const cached = localStorage.getItem('test_cache');
        
        this.assert(
          'Local storage caching works',
          cached === 'test_value'
        );
        
        localStorage.removeItem('test_cache');
      } else {
        this.assert('Local storage caching', true, 'localStorage not available in test environment');
      }
      
    } catch (error) {
      this.assert('Caching functionality', false, (error as Error).message);
    }
  }

  /**
   * Assert a test condition
   */
  private assert(name: string, condition: boolean, error?: string): void {
    this.results.push({
      name,
      passed: condition,
      error
    });
    
    if (condition) {
      console.log(`✅ ${name}`);
    } else {
      console.error(`❌ ${name}${error ? `: ${error}` : ''}`);
    }
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}${r.error ? `: ${r.error}` : ''}`));
    }
  }

  /**
   * Get test results
   */
  getResults() {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      results: this.results
    };
  }
}

/**
 * Performance benchmark utilities
 */
export class PerformanceBenchmark {
  private benchmarks: Map<string, number[]> = new Map();

  /**
   * Run a benchmark multiple times
   */
  async benchmark(name: string, operation: () => Promise<any>, iterations: number = 10): Promise<void> {
    const times: number[] = [];
    
    console.log(`🏃 Running benchmark: ${name} (${iterations} iterations)`);
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }
    
    this.benchmarks.set(name, times);
    this.printBenchmarkResults(name, times);
  }

  /**
   * Print benchmark results
   */
  private printBenchmarkResults(name: string, times: number[]): void {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    
    console.log(`📊 ${name} Results:`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Median: ${median.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }

  /**
   * Get all benchmark results
   */
  getAllResults() {
    const results: Record<string, any> = {};
    
    for (const [name, times] of this.benchmarks.entries()) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
      
      results[name] = { avg, median, min, max, times };
    }
    
    return results;
  }
}

/**
 * Run comprehensive tests in development
 */
export const runDevelopmentTests = async (): Promise<void> => {
  if (import.meta.env.DEV) {
    console.log('🚀 Running development tests...');
    
    const testSuite = new TestSuite();
    await testSuite.runAll();
    
    const benchmark = new PerformanceBenchmark();
    
    // Benchmark rating calculation
    await benchmark.benchmark('Rating Calculation', async () => {
      const { calculateHauntedRating } = await import('./ratingEngine');
      return calculateHauntedRating('castle' as any, 'foggy' as any, 23, 'autumn' as any);
    });
    
    // Benchmark coordinate validation
    await benchmark.benchmark('Coordinate Validation', async () => {
      const { isValidCoordinates } = await import('./index');
      return isValidCoordinates(40.7128, -74.0060);
    });
    
    console.log('✅ Development tests completed');
  }
};