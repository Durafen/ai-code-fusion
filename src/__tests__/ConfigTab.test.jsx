import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfigTab from '../renderer/components/ConfigTab';

describe('ConfigTab', () => {
  const mockConfigContent = '# Test configuration\ninclude_extensions:\n  - .js\n  - .jsx';
  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    // Reset mock before each test
    mockOnConfigChange.mockClear();
  });

  test('renders textarea with config content', () => {
    render(<ConfigTab configContent={mockConfigContent} onConfigChange={mockOnConfigChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe(mockConfigContent);
  });

  test('calls onConfigChange when content changes', () => {
    render(<ConfigTab configContent={mockConfigContent} onConfigChange={mockOnConfigChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New config content' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith('New config content');
  });
});
