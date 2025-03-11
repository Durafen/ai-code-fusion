import '@testing-library/jest-dom';

// Mock the minimatch module
jest.mock('minimatch', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => true),
}));

// Mock the tiktoken module
jest.mock('tiktoken', () => ({
  encoding_for_model: jest.fn().mockImplementation(() => ({
    encode: jest.fn().mockImplementation(() => Array(10)),
  })),
}));

// Mock Electron's APIs
window.electronAPI = {
  selectDirectory: jest.fn().mockResolvedValue('/mock/directory'),
  getDirectoryTree: jest.fn().mockResolvedValue([]),
  saveFile: jest.fn().mockResolvedValue('/mock/output.md'),
  analyzeRepository: jest.fn().mockResolvedValue({
    filesInfo: [],
    totalTokens: 0,
  }),
  processRepository: jest.fn().mockResolvedValue({
    content: '',
    totalTokens: 0,
    processedFiles: 0,
    skippedFiles: 0,
  }),
};
