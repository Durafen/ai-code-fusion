import React, { useState } from 'react';
import TabBar from './TabBar';
import SourceTab from './SourceTab';
import ConfigTab from './ConfigTab';
import AnalyzeTab from './AnalyzeTab';
import ProcessedTab from './ProcessedTab';

const defaultConfig = `# File extensions to include (with dot)
include_extensions:
  - .py
  - .ts
  - .js
  - .md
  - .ini
  - .yaml
  - .yml
  - .kt
  - .go
  - .scm
  - .php

# Patterns to exclude (using fnmatch syntax)
exclude_patterns:
  # Version Control
  - "**/.git/**"
  - "**/.svn/**"
  - "**/.hg/**"
  - "**/vocab.txt"
  - "**.onnx"
  - "**/test*.py"

  # Dependencies
  - "**/node_modules/**"
  - "**/venv/**"
  - "**/env/**"
  - "**/.venv/**"
  - "**/.github/**"
  - "**/vendor/**"
  - "**/website/**"

  # Build outputs
  - "**/test/**"
  - "**/dist/**"
  - "**/build/**"
  - "**/__pycache__/**"
  - "**/*.pyc"

  # Config files
  - "**/.DS_Store"
  - "**/.env"
  - "**/package-lock.json"
  - "**/yarn.lock"
  - "**/.prettierrc"
  - "**/.prettierignore"
  - "**/.gitignore"
  - "**/.gitattributes"
  - "**/.npmrc"

  # Documentation
  - "**/LICENSE*"
  - "**/LICENSE.*"
  - "**/COPYING"
  - "**/CODE_OF**"
  - "**/CONTRIBUTING**"

  # Test files
  - "**/tests/**"
  - "**/test/**"
  - "**/__tests__/**"`;

const App = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [rootPath, setRootPath] = useState('');
  const [directoryTree, setDirectoryTree] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [configContent, setConfigContent] = useState(defaultConfig);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // If switching from config tab and we have a root path, refresh the directory tree
    // This allows the exclude patterns to be applied when the config is updated
    if (activeTab === 'config' && tab === 'source' && rootPath) {
      refreshDirectoryTree();
    }
  };

  // Function to refresh the directory tree with current config
  const refreshDirectoryTree = async () => {
    if (rootPath) {
      const tree = await window.electronAPI.getDirectoryTree(rootPath, configContent);
      setDirectoryTree(tree);

      // Reset selected files and folders that may no longer exist in the new tree
      setSelectedFiles((prev) => {
        return prev.filter((file) => {
          // Check if the file still exists in the tree
          const fileExists = (items) => {
            for (const item of items) {
              if (item.type === 'file' && item.path === file) {
                return true;
              }
              if (item.type === 'directory' && item.children) {
                if (fileExists(item.children)) {
                  return true;
                }
              }
            }
            return false;
          };

          return fileExists(tree);
        });
      });

      setSelectedFolders((prev) => {
        return prev.filter((folder) => {
          // Check if the folder still exists in the tree
          const folderExists = (items) => {
            for (const item of items) {
              if (item.type === 'directory' && item.path === folder) {
                return true;
              }
              if (item.type === 'directory' && item.children) {
                if (folderExists(item.children)) {
                  return true;
                }
              }
            }
            return false;
          };

          return folderExists(tree);
        });
      });
    }
  };

  const handleDirectorySelect = async () => {
    const dirPath = await window.electronAPI.selectDirectory();

    if (dirPath) {
      setRootPath(dirPath);
      const tree = await window.electronAPI.getDirectoryTree(dirPath, configContent);
      setDirectoryTree(tree);
    }
  };

  // Create state for processing options
  const [processingOptions, setProcessingOptions] = useState({ showTokenCount: true });

  const handleAnalyze = async () => {
    if (!rootPath || selectedFiles.length === 0) {
      alert('Please select a root directory and at least one file.');
      return Promise.reject(new Error('No directory or files selected'));
    }

    try {
      // Apply current config before analyzing
      const result = await window.electronAPI.analyzeRepository({
        rootPath,
        configContent,
        selectedFiles,
      });

      setAnalysisResult(result);
      // Switch to analyze tab to show results
      setActiveTab('analyze');
      return Promise.resolve(result);
    } catch (error) {
      console.error('Error analyzing repository:', error);
      alert(`Error analyzing repository: ${error.message}`);
      return Promise.reject(error);
    }
  };

  // Helper function to generate tree view of selected files
  const generateTreeView = () => {
    if (!selectedFiles.length) return '';

    // Create a mapping of paths to help build the tree
    const pathMap = new Map();

    // Process selected files to build a tree structure
    selectedFiles.forEach((filePath) => {
      // Get relative path
      const relativePath = filePath.replace(rootPath, '').replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = relativePath.split('/');

      // Build tree structure
      let currentPath = '';
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const prevPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!pathMap.has(currentPath)) {
          pathMap.set(currentPath, {
            name: part,
            path: currentPath,
            isFile,
            children: [],
            level: index,
          });

          // Add to parent's children
          if (prevPath) {
            const parent = pathMap.get(prevPath);
            if (parent) {
              parent.children.push(pathMap.get(currentPath));
            }
          }
        }
      });
    });

    // Find root nodes (level 0)
    const rootNodes = Array.from(pathMap.values()).filter((node) => node.level === 0);

    // Recursive function to render tree
    const renderTree = (node, prefix = '', isLast = true) => {
      const linePrefix = prefix + (isLast ? '└── ' : '├── ');
      const childPrefix = prefix + (isLast ? '    ' : '│   ');

      let result = linePrefix;

      // Just add the name without icons
      result += node.name + '\n';

      // Sort children: folders first, then files, both alphabetically
      const sortedChildren = [...node.children].sort((a, b) => {
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
        return a.name.localeCompare(b.name);
      });

      // Render children
      sortedChildren.forEach((child) => {
        // Don't create circular reference that could cause stack overflow
        const isChildLast = sortedChildren.indexOf(child) === sortedChildren.length - 1;
        result += renderTree(child, childPrefix, isChildLast);
      });

      return result;
    };

    // Generate the tree text without mentioning the root path
    let treeText = '';
    rootNodes.forEach((node, index) => {
      const isLastRoot = index === rootNodes.length - 1;
      treeText += renderTree(node, '', isLastRoot);
    });

    return treeText;
  };

  // Method to process from the Analyze tab
  const handleProcessDirect = async (treeViewData = null, options = {}) => {
    try {
      if (!analysisResult) {
        throw new Error('No analysis results available');
      }

      // Store processing options
      setProcessingOptions({ ...processingOptions, ...options });

      // Generate tree view if requested but not provided
      const treeViewForProcess =
        treeViewData || (options.includeTreeView ? generateTreeView() : null);

      const result = await window.electronAPI.processRepository({
        rootPath,
        filesInfo: analysisResult.filesInfo,
        treeView: treeViewForProcess,
        options,
      });

      setProcessedResult(result);
      setActiveTab('processed');
      return result;
    } catch (error) {
      console.error('Error processing repository:', error);
      alert(`Error processing repository: ${error.message}`);
      throw error;
    }
  };

  const handleSaveOutput = async () => {
    if (!processedResult) {
      alert('No processed content to save.');
      return;
    }

    try {
      await window.electronAPI.saveFile({
        content: processedResult.content,
        defaultPath: `${rootPath}/output.md`,
      });
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Error saving file: ${error.message}`);
    }
  };

  const handleFileSelect = (filePath, isSelected) => {
    if (isSelected) {
      setSelectedFiles((prev) => [...prev, filePath]);
    } else {
      setSelectedFiles((prev) => prev.filter((path) => path !== filePath));
    }
  };

  // Track selected folders separately from selected files
  const [selectedFolders, setSelectedFolders] = useState([]);

  const handleFolderSelect = (folderPath, isSelected) => {
    // Find the folder in the directory tree
    const findFolder = (items, path) => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }

        if (item.type === 'directory' && item.children) {
          const found = findFolder(item.children, path);
          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    // Get all sub-folders in the folder recursively
    const getAllSubFolders = (folder) => {
      if (!folder || !folder.children) return [];

      let folders = [];

      for (const item of folder.children) {
        if (item.type === 'directory') {
          folders.push(item.path);
          folders = [...folders, ...getAllSubFolders(item)];
        }
      }

      return folders;
    };

    // Get all files in the folder recursively
    const getAllFiles = (folder) => {
      if (!folder || !folder.children) return [];

      let files = [];

      for (const item of folder.children) {
        if (item.type === 'file') {
          files.push(item.path);
        } else if (item.type === 'directory') {
          files = [...files, ...getAllFiles(item)];
        }
      }

      return files;
    };

    const folder = findFolder(directoryTree, folderPath);

    if (folder) {
      // Get all subfolders
      const subFolders = getAllSubFolders(folder);

      // Get all files
      const files = getAllFiles(folder);

      // Update selected folders state
      if (isSelected) {
        // Add this folder and all sub-folders
        setSelectedFolders((prev) => {
          const allFolders = [folderPath, ...subFolders];
          // Filter out duplicates
          return [...new Set([...prev, ...allFolders])];
        });

        // Add all files in this folder and sub-folders
        setSelectedFiles((prev) => {
          // Filter out duplicates
          return [...new Set([...prev, ...files])];
        });
      } else {
        // Remove this folder and all sub-folders
        setSelectedFolders((prev) =>
          prev.filter((path) => path !== folderPath && !subFolders.includes(path))
        );

        // Remove all files in this folder and sub-folders
        setSelectedFiles((prev) => prev.filter((path) => !files.includes(path)));
      }
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='mb-4 text-2xl font-bold'>AI Code Fusion</h1>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className='tab-content rounded border border-gray-300 bg-white p-4'>
        {activeTab === 'config' && (
          <ConfigTab configContent={configContent} onConfigChange={setConfigContent} />
        )}

        {activeTab === 'source' && (
          <SourceTab
            rootPath={rootPath}
            directoryTree={directoryTree}
            selectedFiles={selectedFiles}
            selectedFolders={selectedFolders}
            onDirectorySelect={handleDirectorySelect}
            onFileSelect={handleFileSelect}
            onFolderSelect={handleFolderSelect}
            onAnalyze={handleAnalyze}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeTab analysisResult={analysisResult} onProcess={handleProcessDirect} />
        )}

        {activeTab === 'processed' && (
          <ProcessedTab processedResult={processedResult} onSave={handleSaveOutput} />
        )}
      </div>
    </div>
  );
};

export default App;
