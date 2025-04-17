// --- Core Web Vitals Tracking (Day 14) ---
import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(`${metric.name}: ${metric.value}`);
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname,
    deviceType: getDeviceType(),
    connectionType: getConnectionType()
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  } else {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body,
      keepalive: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
  getFCP(sendToAnalytics);
}

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getConnectionType() {
  if (!navigator.connection) return 'unknown';
  return navigator.connection.effectiveType;
}
