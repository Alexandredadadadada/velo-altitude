// --- Performance Tracking Utilities (Day 14) ---
class PerformanceTracker {
  constructor() {
    this.marks = {};
    this.measures = {};
  }
  startTiming(name) {
    const markName = `start_${name}`;
    performance.mark(markName);
    this.marks[name] = markName;
  }
  endTiming(name, additionalData = {}) {
    const startMark = this.marks[name];
    if (!startMark) {
      console.warn(`No start mark found for ${name}`);
      return;
    }
    const endMark = `end_${name}`;
    performance.mark(endMark);
    const measureName = `measure_${name}`;
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName).pop();
    const duration = measure.duration;
    this.measures[name] = {
      duration,
      timestamp: Date.now(),
      ...additionalData
    };
    this.sendToAnalytics(name, duration, additionalData);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    delete this.marks[name];
    return duration;
  }
  trackApiCall(endpoint, method = 'GET') {
    const name = `api_${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`;
    this.startTiming(name);
    return {
      end: (status, additionalData = {}) => {
        return this.endTiming(name, {
          endpoint,
          method,
          status,
          ...additionalData
        });
      }
    };
  }
  trackRender(componentName) {
    const name = `render_${componentName}`;
    this.startTiming(name);
    return {
      end: (additionalData = {}) => {
        return this.endTiming(name, {
          componentName,
          ...additionalData
        });
      }
    };
  }
  sendToAnalytics(name, duration, additionalData) {
    const body = JSON.stringify({
      name,
      duration,
      page: window.location.pathname,
      timestamp: Date.now(),
      ...additionalData
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/custom-metrics', body);
    } else {
      fetch('/api/analytics/custom-metrics', {
        method: 'POST',
        body,
        keepalive: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
}

export const performanceTracker = new PerformanceTracker();
