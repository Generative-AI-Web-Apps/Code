const createStreamableValue = jest.fn(() => ({
  value: null,
  update: jest.fn(),
  done: jest.fn(),
}));

const createStreamableUI = jest.fn();

module.exports = {
  createStreamableValue,
  createStreamableUI,
  // Add other exports you need
};

// If you need ES module exports too:
module.exports.default = module.exports;