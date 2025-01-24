const {defaults} = require('jest-config');
/** @type {import('jest').Config} */
const config = {
  verbose: true,
  moduleNameMapper: {...defaults.moduleNameMapper,  '^ai/rsc$': '<rootDir>/node_modules/ai/rsc/dist' },
};

module.exports = config;
