const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const { TokenCounter } = require('../utils/token-counter');
const { FileAnalyzer } = require('../utils/file-analyzer');
const { ContentProcessor } = require('../utils/content-processor');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// Set environment
const isDevelopment = process.env.NODE_ENV === 'development';

async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true, // Hide the menu bar by default
    icon: path.join(__dirname, '../assets/icon.ico'), // Set the application icon
  });

  // Hide the menu bar completely in all modes
  mainWindow.setMenu(null);

  // Load the index.html file
  if (isDevelopment) {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.ai.code.fusion');
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Event Handlers

// Select directory dialog
ipcMain.handle('dialog:selectDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (canceled) {
    return null;
  }

  return filePaths[0];
});

// Get directory tree
ipcMain.handle('fs:getDirectoryTree', async (_, dirPath, configContent) => {
  // IMPORTANT: This function applies exclude patterns to the directory tree,
  // preventing node_modules, .git, and other large directories from being included
  // in the UI tree view. This is critical for performance with large repositories.

  // Parse config to get exclude patterns
  const config = configContent ? yaml.parse(configContent) : { exclude_patterns: [] };

  // Default exclude patterns if none provided in config
  const excludePatterns = config.exclude_patterns || [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
  ];

  // Helper function to check if a path should be excluded
  const shouldExclude = (itemPath, itemName) => {
    // Normalize path for pattern matching (use forward slashes)
    const normalizedPath = path.relative(dirPath, itemPath).replace(/\\/g, '/');

    // Check for common directories to exclude
    if (['node_modules', '.git', 'dist', 'build'].includes(itemName)) {
      return true;
    }

    // Check against exclude patterns
    for (const pattern of excludePatterns) {
      try {
        // Simple pattern matching
        if (pattern.includes('*')) {
          // Replace ** with wildcard
          const regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]');

          // Match against the pattern
          const regex = new RegExp(`^${regexPattern}$`);
          if (regex.test(normalizedPath) || regex.test(itemName)) {
            return true;
          }
        } else if (normalizedPath === pattern || itemName === pattern) {
          return true;
        }
      } catch (error) {
        console.error(`Error matching pattern ${pattern}:`, error);
      }
    }
    return false;
  };

  const walkDirectory = (dir) => {
    const items = fs.readdirSync(dir);
    const result = [];

    for (const item of items) {
      try {
        const itemPath = path.join(dir, item);

        // Skip excluded items
        if (shouldExclude(itemPath, item)) {
          continue;
        }

        const stats = fs.statSync(itemPath);
        const ext = path.extname(item).toLowerCase();

        if (stats.isDirectory()) {
          const children = walkDirectory(itemPath);
          // Only include directory if it has children or if we want to show empty dirs
          if (children.length > 0) {
            result.push({
              name: item,
              path: itemPath,
              type: 'directory',
              size: stats.size,
              lastModified: stats.mtime,
              children: children,
              itemCount: children.length,
            });
          }
        } else {
          result.push({
            name: item,
            path: itemPath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime,
            extension: ext,
          });
        }
      } catch (err) {
        console.error(`Error processing ${path.join(dir, item)}:`, err);
        // Continue with next file instead of breaking
      }
    }

    // Sort directories first, then files alphabetically
    return result.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  };

  try {
    return walkDirectory(dirPath);
  } catch (error) {
    console.error('Error getting directory tree:', error);
    return [];
  }
});

// Analyze repository
ipcMain.handle('repo:analyze', async (_, { rootPath, configContent, selectedFiles }) => {
  try {
    const config = yaml.parse(configContent);
    const tokenCounter = new TokenCounter();
    const fileAnalyzer = new FileAnalyzer(config, tokenCounter);

    // If selectedFiles is provided, only analyze those files
    const filesInfo = [];
    let totalTokens = 0;

    for (const filePath of selectedFiles) {
      // Check if file should be processed based on config rules
      const relativePath = path.relative(rootPath, filePath);

      if (fileAnalyzer.shouldProcessFile(relativePath)) {
        const tokenCount = fileAnalyzer.analyzeFile(filePath);

        if (tokenCount !== null) {
          filesInfo.push({
            path: relativePath,
            tokens: tokenCount,
          });

          totalTokens += tokenCount;
        }
      }
    }

    // Sort by token count
    filesInfo.sort((a, b) => b.tokens - a.tokens);

    return {
      filesInfo,
      totalTokens,
    };
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
});

// Process repository
ipcMain.handle('repo:process', async (_, { rootPath, filesInfo, treeView, options = {} }) => {
  try {
    const tokenCounter = new TokenCounter();
    const contentProcessor = new ContentProcessor(tokenCounter);

    // Ensure options is an object with default values if missing
    const processingOptions = {
      showTokenCount: options.showTokenCount !== false, // Default to true if not explicitly false
    };

    console.log('Processing with options:', processingOptions);

    let processedContent = '# Repository Content\n\n';

    // Add tree view if provided
    if (treeView) {
      processedContent += '## File Structure\n\n';
      processedContent += '```\n';
      processedContent += treeView;
      processedContent += '```\n\n';
      processedContent += '## File Contents\n\n';
    }

    let totalTokens = 0;
    let processedFiles = 0;
    let skippedFiles = 0;

    for (const { path: filePath, tokens } of filesInfo) {
      try {
        const fullPath = path.join(rootPath, filePath);

        if (fs.existsSync(fullPath)) {
          const content = contentProcessor.processFile(fullPath, filePath, processingOptions);

          if (content) {
            processedContent += content;
            totalTokens += tokens;
            processedFiles++;
          }
        } else {
          console.warn(`File not found: ${filePath}`);
          skippedFiles++;
        }
      } catch (error) {
        console.warn(`Failed to process ${filePath}: ${error.message}`);
        skippedFiles++;
      }
    }

    processedContent += '\n--END--\n';
    processedContent += `Total tokens: ${totalTokens}\n`;
    processedContent += `Processed files: ${processedFiles}\n`;

    if (skippedFiles > 0) {
      processedContent += `Skipped files: ${skippedFiles}\n`;
    }

    return {
      content: processedContent,
      totalTokens,
      processedFiles,
      skippedFiles,
    };
  } catch (error) {
    console.error('Error processing repository:', error);
    throw error;
  }
});

// Save output to file
ipcMain.handle('fs:saveFile', async (_, { content, defaultPath }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (canceled) {
    return null;
  }

  fs.writeFileSync(filePath, content);
  return filePath;
});
