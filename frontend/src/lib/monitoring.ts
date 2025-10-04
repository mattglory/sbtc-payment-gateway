interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  timestamp: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  performance: PerformanceMetric[];
  uptime: number;
  lastUpdated: string;
}

class MonitoringSystem {
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private performanceMetrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private checkInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.setupDefaultHealthChecks();
    this.startMonitoring();
  }

  private setupDefaultHealthChecks() {
    // API Health Check
    this.addHealthCheck('api', async () => {
      const start = Date.now();
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });

        const latency = Date.now() - start;

        if (response.ok) {
          return {
            service: 'api',
            status: latency > 5000 ? 'degraded' : 'healthy',
            latency,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            service: 'api',
            status: 'unhealthy',
            latency,
            error: `HTTP ${response.status}`,
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        return {
          service: 'api',
          status: 'unhealthy',
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // OpenAI API Health Check
    this.addHealthCheck('openai', async () => {
      const start = Date.now();
      try {
        const response = await fetch('/api/health/openai', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });

        const latency = Date.now() - start;

        return {
          service: 'openai',
          status: response.ok ? (latency > 10000 ? 'degraded' : 'healthy') : 'unhealthy',
          latency,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          service: 'openai',
          status: 'unhealthy',
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Stacks Network Health Check
    this.addHealthCheck('stacks', async () => {
      const start = Date.now();
      try {
        const response = await fetch('https://api.testnet.hiro.so/v2/info', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });

        const latency = Date.now() - start;

        return {
          service: 'stacks',
          status: response.ok ? (latency > 8000 ? 'degraded' : 'healthy') : 'unhealthy',
          latency,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          service: 'stacks',
          status: 'unhealthy',
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Browser Performance Check
    this.addHealthCheck('browser', async () => {
      const start = Date.now();
      try {
        // Check memory usage
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize : 0;

        // Check connection
        const connection = (navigator as any).connection;
        const connectionType = connection ? connection.effectiveType : 'unknown';

        const status = memoryUsage > 0.9 ? 'degraded' : 'healthy';

        return {
          service: 'browser',
          status,
          latency: Date.now() - start,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          service: 'browser',
          status: 'degraded',
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });
  }

  addHealthCheck(name: string, check: () => Promise<HealthCheckResult>) {
    this.healthChecks.set(name, check);
  }

  removeHealthCheck(name: string) {
    this.healthChecks.delete(name);
  }

  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [name, check] of Array.from(this.healthChecks)) {
      try {
        const result = await Promise.race([
          check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 15000)
          )
        ]);
        results.push(result);
      } catch (error) {
        results.push({
          service: name,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  recordPerformanceMetric(name: string, value: number, unit: string, threshold?: { warning: number; critical: number }) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      threshold
    };

    this.performanceMetrics.push(metric);

    // Keep only last 100 metrics per type
    const metricsOfType = this.performanceMetrics.filter(m => m.name === name);
    if (metricsOfType.length > 100) {
      const toRemove = metricsOfType.slice(0, -100);
      this.performanceMetrics = this.performanceMetrics.filter(m => !toRemove.includes(m));
    }
  }

  getPerformanceMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.performanceMetrics.filter(m => m.name === name);
    }
    return this.performanceMetrics;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const services = await this.runHealthChecks();
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices > 0) {
      overall = 'unhealthy';
    } else if (degradedServices > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      services,
      performance: this.performanceMetrics.slice(-20), // Last 20 metrics
      uptime: Date.now() - this.startTime,
      lastUpdated: new Date().toISOString()
    };
  }

  startMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        const status = await this.getSystemStatus();

        // Log critical issues
        const criticalServices = status.services.filter(s => s.status === 'unhealthy');
        if (criticalServices.length > 0) {
          console.error('Critical services down:', criticalServices);
        }

        // Store status in localStorage for debugging
        if (typeof window !== 'undefined') {
          localStorage.setItem('systemStatus', JSON.stringify(status));
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Web Vitals tracking
  trackWebVitals() {
    if (typeof window !== 'undefined') {
      // Core Web Vitals
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          this.recordPerformanceMetric('CLS', metric.value, 'score', { warning: 0.1, critical: 0.25 });
        });

        getFID((metric) => {
          this.recordPerformanceMetric('FID', metric.value, 'ms', { warning: 100, critical: 300 });
        });

        getFCP((metric) => {
          this.recordPerformanceMetric('FCP', metric.value, 'ms', { warning: 1800, critical: 3000 });
        });

        getLCP((metric) => {
          this.recordPerformanceMetric('LCP', metric.value, 'ms', { warning: 2500, critical: 4000 });
        });

        getTTFB((metric) => {
          this.recordPerformanceMetric('TTFB', metric.value, 'ms', { warning: 800, critical: 1800 });
        });
      });
    }
  }

  // Resource monitoring
  trackResourceUsage() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.recordPerformanceMetric('Memory Usage', memoryInfo.usedJSHeapSize / 1024 / 1024, 'MB', { warning: 100, critical: 200 });
        this.recordPerformanceMetric('Memory Limit', memoryInfo.jsHeapSizeLimit / 1024 / 1024, 'MB');
      }

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordPerformanceMetric('DOM Load Time', navigation.domContentLoadedEventEnd - navigation.startTime, 'ms', { warning: 3000, critical: 5000 });
        this.recordPerformanceMetric('Page Load Time', navigation.loadEventEnd - navigation.startTime, 'ms', { warning: 5000, critical: 10000 });
      }
    }
  }

  // Error tracking
  trackError(error: Error, context?: string) {
    console.error('Application error:', error, context);

    // Record error as performance metric
    this.recordPerformanceMetric('Error Count', 1, 'count');

    // You could send this to external error tracking service like Sentry
    if (typeof window !== 'undefined') {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Store in localStorage for debugging
      const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errors.push(errorLog);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem('errorLog', JSON.stringify(errors));
    }
  }
}

// Create monitoring instance
export const monitoring = new MonitoringSystem();

// React hook for monitoring
export const useMonitoring = () => {
  return {
    getSystemStatus: monitoring.getSystemStatus.bind(monitoring),
    recordPerformanceMetric: monitoring.recordPerformanceMetric.bind(monitoring),
    getPerformanceMetrics: monitoring.getPerformanceMetrics.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring)
  };
};

// Initialize web vitals tracking
if (typeof window !== 'undefined') {
  monitoring.trackWebVitals();
  monitoring.trackResourceUsage();

  // Track resource usage every minute
  setInterval(() => {
    monitoring.trackResourceUsage();
  }, 60000);
}

export default monitoring;