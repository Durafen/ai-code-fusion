/**
 * fnmatch compatibility layer using minimatch
 */

const minimatch = require('minimatch');

const fnmatch = {
  fnmatch: (filepath, pattern) => {
    return minimatch(filepath, pattern, { dot: true, matchBase: true });
  },
};

module.exports = fnmatch;
