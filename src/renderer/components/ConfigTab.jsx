import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ConfigTab = ({ configContent, onConfigChange }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = () => {
    onConfigChange(configContent);
    setIsSaved(true);

    // Reset saved status after 2 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(configContent);
    setIsCopied(true);

    // Reset copied status after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div>
      <div className='mb-4'>
        <div className='mb-1 flex items-center justify-between'>
          <label className='block text-sm font-medium text-gray-700'>Configuration</label>
          <div className='text-xs text-gray-500'>
            Edit the configuration to filter which files should be included
          </div>
        </div>
        <textarea
          className='h-64 w-full rounded-md border border-gray-300 p-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'
          value={configContent}
          onChange={(e) => {
            onConfigChange(e.target.value);
            setIsSaved(false);
          }}
        />
      </div>

      <div className='mb-6 flex justify-end space-x-2'>
        <button
          onClick={handleCopy}
          className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          {isCopied ? '✓ Copied' : 'Copy'}
        </button>
        <button
          onClick={handleSave}
          className='inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
        >
          {isSaved ? '✓ Saved' : 'Save Config'}
        </button>
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        <p>Configure which file types to include and patterns to exclude in the analysis.</p>
        <p className='mt-2'>
          After saving your configuration, go to the Source tab to select files and run the
          analysis.
        </p>
      </div>
    </div>
  );
};

ConfigTab.propTypes = {
  configContent: PropTypes.string.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default ConfigTab;
