# Application Assets

This directory contains the assets needed for the application.

## Required Files

### logo.png

A 1024x1024 PNG image is required at this location:

```
src/assets/logo.png
```

This file is used to generate all platform-specific application icons:

- Windows: icon.ico
- macOS: icon.png (used directly by electron-builder)
- Linux: PNG icons in various sizes

The logo.png file:

- Must be exactly 1024x1024 pixels
- Must be a valid PNG image (not a text file)
- Should have a transparent background if possible
- Should be clear and recognizable at small sizes

## Automatically Generated Files

The following files will be automatically generated from logo.png during build:

- src/assets/icon.ico (Windows)
- src/assets/icon.png (macOS)
- build/icons/\*.png (Linux, various sizes)

Do not edit these files directly as they will be overwritten during the build process.
