export class Profiler {
  constructor() {
    this.metrics = {};
  }

  startOperation(operationName) {
    this.metrics[operationName] = {
      start: Performance.now(),
      tokenMetrics: {
        tokensProcessed: 0,
        tokensPerSecond: 0,
      },
      streamMetrics: {
        chunkCount: 0,
        avgChunkLatency: 0,
      },
    };
  }

  endOperation(operationName, { totalTokens = 0 } = {}) {
    const end = Performance.now();
    const duration = end - this.metrics[operationName].start;

    this.metrics[operationName].duration = duration;
    if (totalTokens > 0) {
      this.metrics[operationName].tokenMetrics.tokensProcessed = totalTokens;
      this.metrics[operationName].tokenMetrics.tokensPerSecond = (totalTokens / duration) * 1000;
    }

    return {
      duration,
      ...this.metrics[operationName],
    };
  }

  recordStreamChunk(operationName) {
    const currentTime = Performance.now();
    const metrics = this.metrics[operationName];

    metrics.streamMetrics.chunkCount++;
    const chunkLatency = currentTime - metrics.lastChunkTime || 0;

    // Update running average of chunk latency
    metrics.streamMetrics.avgChunkLatency =
      (metrics.streamMetrics.avgChunkLatency * (metrics.streamMetrics.chunkCount - 1) + chunkLatency) /
      metrics.streamMetrics.chunkCount;

    metrics.lastChunkTime = currentTime;
  }

  getMetrics(operationName) {
    return this.metrics[operationName];
  }
}
