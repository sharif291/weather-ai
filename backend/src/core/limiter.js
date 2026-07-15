class RequestQueue {
  constructor(delayMs = 200) {
    this.queue = [];
    this.isProcessing = false;
    this.delayMs = delayMs; // 200ms delay = max 5 requests per second
  }

  /**
   * Enqueue a function returning a promise.
   * Resolves when the task executes.
   */
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.start();
    });
  }

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      
      // Delay before the next request is processed to prevent rate-limit overflow
      if (this.queue.length > 0) {
        await new Promise((r) => setTimeout(r, this.delayMs));
      }
    }

    this.isProcessing = false;
  }
}

// Export a singleton request throttler for the WeatherAI API
export const apiThrottler = new RequestQueue(205); // slightly above 200ms for safety buffer
export default apiThrottler;
