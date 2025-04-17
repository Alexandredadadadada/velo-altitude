// Exponential backoff retry utility for API calls
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (!shouldRetryError(error)) {
        throw error;
      }
      // Exponential backoff + jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }
  throw lastError;
}

function shouldRetryError(error) {
  if (error.name === 'TypeError' && error.message.includes('network')) return true;
  if (error.response && [408, 429, 500, 502, 503, 504].includes(error.response.status)) return true;
  return false;
}
