class TokenTracker {
  constructor() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalExecutionTokens = 0;
    this.lastTotalTokens = 0; // To keep track of the last total tokens used
  }

  updateTokens(usageMetadata) {
    // Update the total counts
    this.totalInputTokens += usageMetadata?.input_tokens ?? 0;
    this.totalOutputTokens += usageMetadata?.output_tokens ?? 0;
    this.totalExecutionTokens += usageMetadata?.total_tokens ?? 0;

    // Store the current total tokens for diff calculation
    this.lastTotalTokens = usageMetadata?.total_tokens ?? 0;
  }
  getCurrentUsage() {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalExecutionTokens: this.totalExecutionTokens,
      lastTotalTokens: this.lastTotalTokens,
    };
  }

  getTokenDiff() {
    return {
      inputDiff:
        this.lastTotalTokens -
        (this.totalInputTokens - (this.lastTotalTokens || 0)),
      outputDiff:
        this.lastTotalTokens -
        (this.totalOutputTokens - (this.lastTotalTokens || 0)),
      executionDiff:
        this.lastTotalTokens -
        (this.totalExecutionTokens - (this.lastTotalTokens || 0)),
    };
  }
}

export default TokenTracker;
