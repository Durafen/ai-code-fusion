const fs = require('fs');
const path = require('path');

// Define our own pattern matching function
// Don't try to require minimatch as it causes issues
const matchPattern = (filepath, pattern) => {
  try {
    // Simple implementation of glob pattern matching
    if (pattern.includes('*')) {
      // Escape special regex characters except * and ?
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        // Replace ** with a unique placeholder
        .replace(/\*\*/g, '__DOUBLE_STAR__')
        // Replace * with regex for any character except /
        .replace(/\*/g, '[^/]*')
        // Replace ? with regex for a single character
        .replace(/\?/g, '[^/]')
        // Replace the double star placeholder with regex for any character
        .replace(/__DOUBLE_STAR__/g, '.*');

      // Add start and end anchors
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filepath);
    }

    // For simple patterns, just check if filepath ends with pattern
    return filepath === pattern || filepath.endsWith(`/${pattern}`);
  } catch (error) {
    console.error(`Error in pattern matching ${pattern} against ${filepath}:`, error);
    // Super simple fallback
    return filepath.includes(pattern.replace('*', ''));
  }
};

class FileAnalyzer {
  constructor(config, tokenCounter) {
    this.config = config;
    this.tokenCounter = tokenCounter;
  }

  shouldProcessFile(filePath) {
    // Convert path to forward slashes for consistent pattern matching
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check if path contains node_modules - explicit check
    if (normalizedPath.split('/').includes('node_modules')) {
      return false;
    }

    // Check each part of the path against exclude patterns
    const pathParts = normalizedPath.split('/');
    for (let i = 0; i < pathParts.length; i++) {
      const currentPath = pathParts.slice(i).join('/');

      for (const pattern of this.config.exclude_patterns || []) {
        // Remove leading **/ from pattern for direct matching
        const cleanPattern = pattern.replace('**/', '');

        if (
          this._matchPattern(currentPath, cleanPattern) ||
          this._matchPattern(currentPath, pattern)
        ) {
          return false;
        }
      }
    }

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();

    // Check if extension is in included list
    return (this.config.include_extensions || []).includes(ext);
  }

  _matchPattern(filepath, pattern) {
    return matchPattern(filepath, pattern);
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' });
      return this.tokenCounter.countTokens(content);
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }

  createAnalysis() {
    const totalTokens = 0;
    const filesInfo = [];

    // Implement the rest of the analysis logic if needed
    // This is handled by the main process in this implementation

    return {
      filesInfo,
      totalTokens,
    };
  }
}

module.exports = { FileAnalyzer };
