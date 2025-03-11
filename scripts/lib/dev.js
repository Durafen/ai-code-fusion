/**
 * Development environment functions
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Format log messages
const log = (message, color = colors.reset) => {
  console.log(`${color}[dev] ${message}${colors.reset}`);
};

/**
 * Start the development environment
 */
async function start() {
  log('Starting development environment...', colors.green);

  try {
    // Build CSS if it doesn't exist
    const cssFile = path.join(utils.ROOT_DIR, 'src', 'renderer', 'output.css');
    if (!fs.existsSync(cssFile)) {
      log('CSS not found, building...', colors.yellow);
      utils.runNpmScript('build:css');
    }

    // Check if webpack output exists
    const webpackOutput = path.join(utils.ROOT_DIR, 'src', 'renderer', 'index.js');
    if (!fs.existsSync(webpackOutput)) {
      log('Webpack bundle not found, building...', colors.yellow);
      utils.runNpmScript('build:webpack');
    }

    // Start the dev server using concurrently to run all necessary processes
    log('Starting development server...', colors.blue);

    // Use concurrently directly to run all the required processes
    const { spawn } = require('child_process');

    const concurrently = spawn(
      'npx',
      [
        'concurrently',
        '--kill-others',
        'npm:watch:css',
        'npm:watch:webpack',
        `cross-env NODE_ENV=development electron .`,
      ],
      {
        stdio: 'inherit',
        shell: true,
        cwd: utils.ROOT_DIR,
      }
    );

    // Handle process exit
    concurrently.on('close', (code) => {
      if (code !== 0) {
        log(`Development process exited with code ${code}`, colors.red);
        process.exit(code);
      }
    });

    // Forward process signals
    process.on('SIGINT', () => concurrently.kill('SIGINT'));
    process.on('SIGTERM', () => concurrently.kill('SIGTERM'));

    return true;
  } catch (error) {
    log(`Development server failed to start: ${error.message}`, colors.red);
    throw error;
  }
}

module.exports = {
  start,
};
