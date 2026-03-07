// Performance Monitoring Script
// This script tracks website loading performance and logs metrics to console

(function() {
    // Store initial timestamp
    const navigationStart = window.performance.timing.navigationStart;

    // Function to log performance metrics
    function logPerformanceMetrics() {
        if (!window.performance || !window.performance.timing) {
            console.warn('Performance API not available');
            return;
        }

        const timing = window.performance.timing;
        const perfData = {
            // Navigation timing
            'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
            'TCP Connection': timing.connectEnd - timing.connectStart,
            'Time to First Byte (TTFB)': timing.responseStart - timing.navigationStart,
            'Download Time': timing.responseEnd - timing.responseStart,
            'DOM Processing': timing.domComplete - timing.domLoading,
            'DOM Content Loaded': timing.domContentLoadedEventEnd - timing.navigationStart,
            'Total Page Load': timing.loadEventEnd - timing.navigationStart,
        };

        console.group('📊 Performance Metrics');
        Object.entries(perfData).forEach(([metric, value]) => {
            console.log(`${metric}: ${value}ms`);
        });
        console.groupEnd();

        // Log to server (optional)
        logMetricsToServer(perfData);
    }

    // Function to log metrics to server
    function logMetricsToServer(metrics) {
        // This would send to your analytics service
        // Example: fetch('/api/analytics/performance', { method: 'POST', body: JSON.stringify(metrics) })
        
        // Store in localStorage for debugging
        try {
            localStorage.setItem('lastPerformanceMetrics', JSON.stringify({
                timestamp: new Date().toISOString(),
                metrics: metrics
            }));
        } catch (e) {
            // localStorage might be full or disabled
        }
    }

    // Log metrics when page is fully loaded
    if (document.readyState === 'complete') {
        logPerformanceMetrics();
    } else {
        window.addEventListener('load', logPerformanceMetrics);
    }

    // Also log Resource Timing if available
    function logResourceTiming() {
        if (!window.performance || !window.performance.getEntriesByType) {
            return;
        }

        const resources = window.performance.getEntriesByType('resource');
        
        console.group('⚡ Resource Loading Times (Top 10)');
        
        // Sort by duration and show top 10 slowest resources
        resources
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
            .forEach(resource => {
                const name = resource.name.split('/').pop() || resource.name;
                console.log(`${name}: ${resource.duration.toFixed(2)}ms (${(resource.transferSize / 1024).toFixed(2)}KB)`);
            });
        
        console.groupEnd();
    }

    // Log resource timing after page load
    if (document.readyState === 'complete') {
        setTimeout(logResourceTiming, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(logResourceTiming, 1000);
        });
    }

    // Monitor Core Web Vitals (if available)
    function monitorCoreWebVitals() {
        if (!window.PerformanceObserver) {
            console.warn('PerformanceObserver not available');
            return;
        }

        try {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log(`🖼️ Largest Contentful Paint (LCP): ${lastEntry.renderTime || lastEntry.loadTime}ms`);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    console.log(`⌨️ First Input Delay (FID): ${entry.processingDuration}ms`);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                console.log(`📊 Cumulative Layout Shift (CLS): ${clsValue.toFixed(3)}`);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.warn('Could not monitor Core Web Vitals:', e.message);
        }
    }

    // Monitor Core Web Vitals
    if (document.readyState === 'complete') {
        setTimeout(monitorCoreWebVitals, 100);
    } else {
        window.addEventListener('load', () => {
            setTimeout(monitorCoreWebVitals, 100);
        });
    }

})();

// Export for use in other scripts
window.PerformanceMonitor = {
    getMetrics: function() {
        return localStorage.getItem('lastPerformanceMetrics') 
            ? JSON.parse(localStorage.getItem('lastPerformanceMetrics'))
            : null;
    },
    clearMetrics: function() {
        localStorage.removeItem('lastPerformanceMetrics');
    }
};
