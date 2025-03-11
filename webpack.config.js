const path = require('path');
const fs = require('fs');

// Check if the entry file exists and create it if it doesn't
const entryFile = path.resolve(__dirname, 'src/renderer/index.js');
if (!fs.existsSync(entryFile)) {
  const entryContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
`;
  fs.writeFileSync(entryFile, entryContent);
  console.log('Created entry file:', entryFile);
}

module.exports = {
  entry: entryFile,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'src/renderer'),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
    },
  },
  devtool: 'source-map',
};
