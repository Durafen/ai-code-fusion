#!/usr/bin/env node
/**
 * Icon Generator for Electron Application
 *
 * Generates all required platform-specific icons from a single 1024x1024 PNG image.
 * This script only needs to be run once or when updating the application icon.
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths configuration
const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_LOGO = path.join(ROOT_DIR, 'src/assets/logo.png');
const TEMP_DIR = path.join(ROOT_DIR, '.tmp_icons');
const ASSETS_ICONS_DIR = path.join(ROOT_DIR, 'src/assets/icons');
const WINDOWS_ICON_DEST = path.join(ROOT_DIR, 'src/assets/icon.ico');
const MACOS_ICON_DEST = path.join(ROOT_DIR, 'src/assets/icon.icns');
const LINUX_ICONS_DIR = path.join(ROOT_DIR, 'build/icons');

// Helper functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function validateSourceLogo() {
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`\nError: Source logo not found at ${SOURCE_LOGO}`);
    console.error('Please create a 1024x1024 PNG image file at this location.');
    process.exit(1);
  }

  // Check if it's a valid PNG
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(SOURCE_LOGO, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    if (!isPng) {
      console.error(`\nError: ${SOURCE_LOGO} is not a valid PNG file.`);
      console.error('Please provide a proper PNG image file.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\nError reading source logo: ${error.message}`);
    process.exit(1);
  }
}

function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      console.log(`Removed temporary directory: ${TEMP_DIR}`);
    } catch (error) {
      console.warn(`Warning: Could not remove temporary directory: ${error.message}`);
    }
  }
}

// Main icon generation function
async function generateIcons() {
  console.log('\n=== ELECTRON ICON GENERATOR ===\n');

  try {
    // Validate source logo
    validateSourceLogo();

    // Ensure directories exist
    ensureDir(path.dirname(WINDOWS_ICON_DEST));
    ensureDir(path.dirname(MACOS_ICON_DEST));
    ensureDir(LINUX_ICONS_DIR);
    ensureDir(TEMP_DIR);

    // Install electron-icon-builder if not already available
    console.log('Installing icon generation tools...');
    execSync('npm install --no-save electron-icon-builder', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });

    // Generate icons
    console.log('\nGenerating platform-specific icons...');
    execSync(`npx electron-icon-builder --input="${SOURCE_LOGO}" --output="${TEMP_DIR}"`, {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });

    // Copy icons to their final destinations
    console.log('\nCopying icons to their final destinations...');

    // Create assets/icons structure
    ensureDir(ASSETS_ICONS_DIR);
    ensureDir(path.join(ASSETS_ICONS_DIR, 'win'));
    ensureDir(path.join(ASSETS_ICONS_DIR, 'mac'));
    ensureDir(path.join(ASSETS_ICONS_DIR, 'png'));

    // Windows icon
    const winIconSrc = path.join(TEMP_DIR, 'icons/win/icon.ico');
    if (fs.existsSync(winIconSrc)) {
      // Copy to both locations
      fs.copyFileSync(winIconSrc, WINDOWS_ICON_DEST);
      fs.copyFileSync(winIconSrc, path.join(ASSETS_ICONS_DIR, 'win/icon.ico'));
      console.log(`✓ Windows icon created: ${WINDOWS_ICON_DEST}`);
      console.log(`✓ Windows icon copied to: ${path.join(ASSETS_ICONS_DIR, 'win/icon.ico')}`);
    } else {
      console.error(`✗ Windows icon generation failed`);
    }

    // macOS icon
    const macIconSrc = path.join(TEMP_DIR, 'icons/mac/icon.icns');
    if (fs.existsSync(macIconSrc)) {
      // Copy to both locations
      fs.copyFileSync(macIconSrc, MACOS_ICON_DEST);
      fs.copyFileSync(macIconSrc, path.join(ASSETS_ICONS_DIR, 'mac/icon.icns'));
      console.log(`✓ macOS icon created: ${MACOS_ICON_DEST}`);
      console.log(`✓ macOS icon copied to: ${path.join(ASSETS_ICONS_DIR, 'mac/icon.icns')}`);
    } else {
      console.error(`✗ macOS icon generation failed`);
    }

    // Linux icons
    const pngDir = path.join(TEMP_DIR, 'icons/png');
    if (fs.existsSync(pngDir)) {
      const pngFiles = fs.readdirSync(pngDir).filter((file) => file.endsWith('.png'));

      for (const file of pngFiles) {
        const sourcePath = path.join(pngDir, file);
        // Copy to both locations
        const destPath = path.join(LINUX_ICONS_DIR, file);
        const assetDestPath = path.join(ASSETS_ICONS_DIR, 'png', file);
        fs.copyFileSync(sourcePath, destPath);
        fs.copyFileSync(sourcePath, assetDestPath);
      }

      // Also copy 512x512 as icon.png (main icon)
      const png512 = path.join(pngDir, '512x512.png');
      if (fs.existsSync(png512)) {
        fs.copyFileSync(png512, path.join(LINUX_ICONS_DIR, 'icon.png'));
      }

      console.log(`✓ Linux icons created in: ${LINUX_ICONS_DIR}`);
      console.log(`✓ Linux icons copied to: ${path.join(ASSETS_ICONS_DIR, 'png')}`);
    } else {
      console.error(`✗ Linux icon generation failed`);
    }

    console.log('\n=== ICON GENERATION COMPLETE ===\n');
    console.log('The following icon files have been generated:');
    console.log(
      `• Windows: ${WINDOWS_ICON_DEST} and ${path.join(ASSETS_ICONS_DIR, 'win/icon.ico')}`
    );
    console.log(`• macOS: ${MACOS_ICON_DEST} and ${path.join(ASSETS_ICONS_DIR, 'mac/icon.icns')}`);
    console.log(
      `• Linux: ${LINUX_ICONS_DIR}/*.png and ${path.join(ASSETS_ICONS_DIR, 'png')}/*.png`
    );
    console.log('\nThese files should be committed to your repository.');
  } catch (error) {
    console.error(`\nIcon generation failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temporary files
    cleanup();
  }
}

// Run the icon generation
generateIcons().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
