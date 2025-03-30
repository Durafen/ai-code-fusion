const fs = require('fs');
const path = require('path');
const { isBinaryFile } = require('./file-analyzer');

class ContentProcessor {
  constructor(tokenCounter) {
    this.tokenCounter = tokenCounter;
  }

  processFile(filePath, relativePath, options = {}) {
    try {
      // For binary files, show a note instead of content
      if (isBinaryFile(filePath)) {
        console.log(`Binary file detected during processing: ${filePath}`);

        // Get file stats for size info
        const stats = fs.statSync(filePath);
        const fileSizeInKB = (stats.size / 1024).toFixed(2);

        const headerContent = `${relativePath} (binary file)`;

        const formattedContent =
          `######\n` +
          `${headerContent}\n` +
          `######\n\n` +
          `[BINARY FILE]\n` +
          `File Type: ${path.extname(filePath).replace('.', '').toUpperCase()}\n` +
          `Size: ${fileSizeInKB} KB\n\n` +
          `Note: Binary files are included in the file tree but not processed for content.\n\n`;

        return formattedContent;
      }

      // Process only text files
      const content = fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' });
      const tokenCount = this.tokenCounter.countTokens(content);

      // Show token count if requested (default is true)
      const showTokenCount = options.showTokenCount !== false;

      const headerContent = showTokenCount
        ? `${relativePath} (${tokenCount} tokens)`
        : `${relativePath}`;

      const formattedContent =
        `######\n` + `${headerContent}\n` + `######\n\n` + `\`\`\`\n${content}\n\`\`\`\n\n`;

      return formattedContent;
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return null;
    }
  }

  readAnalysisFile(analysisPath) {
    const filesToProcess = [];

    try {
      const content = fs.readFileSync(analysisPath, { encoding: 'utf-8', flag: 'r' });
      const lines = content.split('\n').map((line) => line.trim());

      // Process pairs of lines (path and token count)
      for (let i = 0; i < lines.length - 1; i += 2) {
        if (i + 1 >= lines.length) {
          break;
        }

        const path = lines[i].trim();
        if (path.startsWith('Total tokens:')) {
          break;
        }

        try {
          const tokens = parseInt(lines[i + 1].trim());
          // Clean up the path
          const cleanPath = path.replace(/\\/g, '/').trim();
          filesToProcess.push({ path: cleanPath, tokens });
        } catch (error) {
          console.warn(`Failed to parse line ${i}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error reading analysis file ${analysisPath}:`, error);
    }

    return filesToProcess;
  }
}

module.exports = { ContentProcessor };
