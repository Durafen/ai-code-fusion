# Configuration Guide

The AI Code Fusion uses a YAML configuration for file filtering. This document explains the available configuration options and best practices.

## Configuration Format

The application uses YAML format for its configuration:

```yaml
# File extensions to include (with dot)
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
  - '**/.git/**'
  - '**/.svn/**'
  - '**/.hg/**'
  - '**/vocab.txt'
  - '**.onnx'
  - '**/test*.py'

  # Dependencies
  - '**/node_modules/**'
  - '**/venv/**'
  - '**/env/**'
  - '**/.venv/**'
  - '**/.github/**'
  - '**/vendor/**'
  - '**/website/**'

  # Build outputs
  - '**/test/**'
  - '**/dist/**'
  - '**/build/**'
  - '**/__pycache__/**'
  - '**/*.pyc'

  # Config files
  - '**/.DS_Store'
  - '**/.env'
  - '**/package-lock.json'
  - '**/yarn.lock'
  - '**/.prettierrc'
  - '**/.prettierignore'
  - '**/.gitignore'
  - '**/.gitattributes'
  - '**/.npmrc'

  # Documentation
  - '**/LICENSE*'
  - '**/LICENSE.*'
  - '**/COPYING'
  - '**/CODE_OF**'
  - '**/CONTRIBUTING**'

  # Test files
  - '**/tests/**'
  - '**/test/**'
  - '**/__tests__/**'
```

## Configuration Options

### Include Extensions

The `include_extensions` section specifies file extensions that should be processed. Only files with these extensions will be considered for processing.

Example:

```yaml
include_extensions:
  - .py # Include Python files
  - .js # Include JavaScript files
  - .md # Include Markdown files
```

### Exclude Patterns

The `exclude_patterns` section specifies patterns for files and directories that should be excluded from processing, even if they have an included extension.

Patterns use the fnmatch syntax:

- `*` matches any sequence of characters
- `**` matches any sequence of directories
- `?` matches a single character

Example:

```yaml
exclude_patterns:
  - '**/node_modules/**' # Exclude all node_modules directories
  - '**/.git/**' # Exclude Git directories
  - '**/test*.py' # Exclude Python files that start with 'test'
```

## Best Practices

1. **Start with a broad configuration** and refine as needed
2. **Group related patterns** with comments for better organization
3. **Be specific with extensions** to avoid processing unnecessary files
4. **Use the file preview** to verify your configuration is working as expected
5. **Check token counts** to ensure you stay within your model's context limit

## Common Configurations

### For JavaScript/TypeScript Projects

```yaml
include_extensions:
  - .js
  - .jsx
  - .ts
  - .tsx
  - .md
  - .json

exclude_patterns:
  - '**/node_modules/**'
  - '**/dist/**'
  - '**/build/**'
  - '**/.cache/**'
  - '**/coverage/**'
  - '**/*.test.*'
  - '**/*.spec.*'
```

### For Python Projects

```yaml
include_extensions:
  - .py
  - .md
  - .yml
  - .yaml
  - .ini

exclude_patterns:
  - '**/venv/**'
  - '**/.venv/**'
  - '**/__pycache__/**'
  - '**/*.pyc'
  - '**/tests/**'
  - '**/.pytest_cache/**'
```

## Troubleshooting

- **No files are processed**: Check that the file extensions match your project files
- **Too many files are processed**: Add more specific exclude patterns
- **Important files are excluded**: Check for conflicting exclude patterns
- **Token count is too high**: Add more exclude patterns to reduce the number of files
