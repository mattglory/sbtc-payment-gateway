import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ESGAnalyzer from '../../../components/ai/ESGAnalyzer';
import { ThemeProvider } from '../../../hooks/useTheme';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ESGAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ESG analyzer header correctly', () => {
    renderWithProviders(<ESGAnalyzer />);

    expect(screen.getByText('AI-Powered ESG Analysis')).toBeInTheDocument();
    expect(screen.getByText('Get comprehensive sustainability analysis powered by GPT-4')).toBeInTheDocument();
  });

  it('displays the search form', () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');
    expect(searchInput).toBeInTheDocument();

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
  });

  it('handles search input correctly', () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');

    fireEvent.change(searchInput, { target: { value: 'TSLA' } });
    expect(searchInput).toHaveValue('TSLA');
  });

  it('performs analysis when form is submitted', async () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(searchInput, { target: { value: 'TSLA' } });
    fireEvent.click(analyzeButton);

    // Check that the button shows analyzing state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText(/TSLA Company Analysis/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays analysis results after successful analysis', async () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(searchInput, { target: { value: 'AAPL' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/AAPL Company Analysis/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check for ESG score breakdown
    expect(screen.getByText('Environmental')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();

    // Check for AI insights section
    expect(screen.getByText('AI Insights')).toBeInTheDocument();

    // Check for recommendations section
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('shows recent analyses after performing analysis', async () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    // Perform first analysis
    fireEvent.change(searchInput, { target: { value: 'MSFT' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/MSFT Company Analysis/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that recent analyses section appears
    expect(screen.getByText('Recent Analyses')).toBeInTheDocument();
  });

  it('disables analyze button when input is empty', () => {
    renderWithProviders(<ESGAnalyzer />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeDisabled();
  });

  it('enables analyze button when input has value', () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(searchInput, { target: { value: 'GOOGL' } });
    expect(analyzeButton).not.toBeDisabled();
  });

  it('handles keyboard submission (Enter key)', async () => {
    renderWithProviders(<ESGAnalyzer />);

    const searchInput = screen.getByPlaceholderText('Enter company symbol (e.g., TSLA, AAPL, MSFT)');

    fireEvent.change(searchInput, { target: { value: 'NVDA' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });
  });
});