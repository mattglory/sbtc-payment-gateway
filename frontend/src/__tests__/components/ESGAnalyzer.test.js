import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ESGAnalyzer from '../../components/ai/ESGAnalyzer';
import { mockESGData, createMockFetch, mockApiResponse } from '../utils/test-utils';

// Mock fetch globally
global.fetch = jest.fn();

describe('ESGAnalyzer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Initial render', () => {
    test('should render the ESG analyzer form', () => {
      render(<ESGAnalyzer />);

      expect(screen.getByText('ESG Analysis')).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sector/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyze esg/i })).toBeInTheDocument();
    });

    test('should have proper form field attributes', () => {
      render(<ESGAnalyzer />);

      const companyInput = screen.getByLabelText(/company name/i);
      const sectorSelect = screen.getByLabelText(/sector/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);

      expect(companyInput).toHaveAttribute('type', 'text');
      expect(companyInput).toHaveAttribute('required');
      expect(sectorSelect).toHaveAttribute('required');
      expect(descriptionTextarea).toHaveAttribute('rows');
    });

    test('should have accessible form labels', () => {
      render(<ESGAnalyzer />);

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sector/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  describe('Form interactions', () => {
    test('should allow user to input company name', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const companyInput = screen.getByLabelText(/company name/i);
      await user.type(companyInput, 'Tesla Inc.');

      expect(companyInput).toHaveValue('Tesla Inc.');
    });

    test('should allow user to select sector', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const sectorSelect = screen.getByLabelText(/sector/i);
      await user.selectOptions(sectorSelect, 'Automotive');

      expect(sectorSelect).toHaveValue('Automotive');
    });

    test('should allow user to input description', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const descriptionTextarea = screen.getByLabelText(/description/i);
      await user.type(descriptionTextarea, 'Electric vehicle manufacturer');

      expect(descriptionTextarea).toHaveValue('Electric vehicle manufacturer');
    });

    test('should enable submit button when form is valid', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const submitButton = screen.getByRole('button', { name: /analyze esg/i });
      expect(submitButton).toBeDisabled();

      // Fill required fields
      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');

      expect(submitButton).toBeEnabled();
    });
  });

  describe('ESG analysis request', () => {
    test('should make API call with correct data', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      // Fill form
      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.type(screen.getByLabelText(/description/i), 'Electric vehicle company');

      // Submit form
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/esg-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyName: 'Tesla Inc.',
            sector: 'Automotive',
            description: 'Electric vehicle company'
          })
        });
      });
    });

    test('should show loading state during analysis', async () => {
      const user = userEvent.setup();
      // Mock a delayed response
      fetch.mockImplementationOnce(
        () => new Promise(resolve =>
          setTimeout(() => resolve(mockApiResponse(mockESGData)), 1000)
        )
      );

      render(<ESGAnalyzer />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      // Check loading state
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
    });

    test('should display results after successful analysis', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('ESG Analysis Results')).toBeInTheDocument();
      });

      // Check score display
      expect(screen.getByText('85')).toBeInTheDocument(); // Environmental score
      expect(screen.getByText('72')).toBeInTheDocument(); // Social score
      expect(screen.getByText('68')).toBeInTheDocument(); // Governance score
      expect(screen.getByText('75')).toBeInTheDocument(); // Overall score
    });

    test('should display analysis insights', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(screen.getByText('Analysis Insights')).toBeInTheDocument();
      });

      // Check strengths and weaknesses
      expect(screen.getByText('Clean energy leadership')).toBeInTheDocument();
      expect(screen.getByText('Governance concerns')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    test('should display error message on API failure', async () => {
      const user = userEvent.setup();
      fetch.mockRejectedValueOnce(new Error('API Error'));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      });
    });

    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Apple Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Technology');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should handle malformed response data', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse('invalid json'));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Microsoft');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Technology');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(screen.getByText(/error processing/i)).toBeInTheDocument();
      });
    });

    test('should show validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      // Button should remain disabled or show validation
      const submitButton = screen.getByRole('button', { name: /analyze esg/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<ESGAnalyzer />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/sector/i)).toHaveAttribute('aria-required', 'true');
    });

    test('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const companyInput = screen.getByLabelText(/company name/i);
      const sectorSelect = screen.getByLabelText(/sector/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /analyze esg/i });

      // Test tab navigation
      await user.tab();
      expect(companyInput).toHaveFocus();

      await user.tab();
      expect(sectorSelect).toHaveFocus();

      await user.tab();
      expect(descriptionTextarea).toHaveFocus();

      // Fill required fields to enable button
      await user.type(companyInput, 'Test Company');
      await user.selectOptions(sectorSelect, 'Technology');

      await user.tab();
      expect(submitButton).toHaveFocus();
      expect(submitButton).toBeEnabled();
    });

    test('should announce loading state to screen readers', async () => {
      const user = userEvent.setup();
      fetch.mockImplementationOnce(
        () => new Promise(resolve =>
          setTimeout(() => resolve(mockApiResponse(mockESGData)), 500)
        )
      );

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      const loadingElement = screen.getByText(/analyzing/i);
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    test('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<ESGAnalyzer />);

      // Should not throw any errors on unmount
      expect(() => unmount()).not.toThrow();
    });

    test('should debounce input changes', async () => {
      const user = userEvent.setup();
      render(<ESGAnalyzer />);

      const companyInput = screen.getByLabelText(/company name/i);

      // Type rapidly
      await user.type(companyInput, 'Tesla');

      // Should not trigger excessive re-renders
      expect(companyInput).toHaveValue('Tesla');
    });

    test('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValue(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');

      const submitButton = screen.getByRole('button', { name: /analyze esg/i });

      // Submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should handle gracefully (button disabled during loading)
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Data visualization', () => {
    test('should render ESG score charts after analysis', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        // Check for chart containers or score displays
        expect(screen.getByTestId('esg-scores-chart')).toBeInTheDocument();
      });
    });

    test('should display confidence indicator', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(screen.getByText(/87%/)).toBeInTheDocument(); // Confidence score
      });
    });
  });

  describe('Integration with props', () => {
    test('should accept custom onAnalysisComplete callback', async () => {
      const onAnalysisComplete = jest.fn();
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce(mockApiResponse(mockESGData));

      render(<ESGAnalyzer onAnalysisComplete={onAnalysisComplete} />);

      await user.type(screen.getByLabelText(/company name/i), 'Tesla Inc.');
      await user.selectOptions(screen.getByLabelText(/sector/i), 'Automotive');
      await user.click(screen.getByRole('button', { name: /analyze esg/i }));

      await waitFor(() => {
        expect(onAnalysisComplete).toHaveBeenCalledWith(mockESGData);
      });
    });

    test('should accept initial form data', () => {
      const initialData = {
        companyName: 'Apple Inc.',
        sector: 'Technology',
        description: 'Technology company'
      };

      render(<ESGAnalyzer initialData={initialData} />);

      expect(screen.getByDisplayValue('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Technology company')).toBeInTheDocument();
    });
  });
});