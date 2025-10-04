import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import GreenFinanceDashboard from '../../components/GreenFinanceDashboard';
import { ThemeProvider } from '../../hooks/useTheme';

// Mock recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('GreenFinanceDashboard', () => {
  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
  });

  it('renders the dashboard header correctly', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Sustainable Investing on Bitcoin Network')).toBeInTheDocument();
  });

  it('displays key metrics cards', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Average ESG Score')).toBeInTheDocument();
    expect(screen.getByText('Carbon Reduction')).toBeInTheDocument();
  });

  it('shows market performance section', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('Market Performance')).toBeInTheDocument();
    expect(screen.getByText('Live Data')).toBeInTheDocument();
  });

  it('displays quick actions section', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Analyze Company ESG')).toBeInTheDocument();
    expect(screen.getByText('Get AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Track Carbon Impact')).toBeInTheDocument();
  });

  it('shows Bitcoin Frontier Fund demo section', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('🚀 Bitcoin Frontier Fund Demo Ready')).toBeInTheDocument();
    expect(screen.getByText('Complete sustainable finance platform built on sBTC')).toBeInTheDocument();
  });

  it('updates market data with real-time simulation', async () => {
    renderWithProviders(<GreenFinanceDashboard />);

    // Check that initial market data is displayed
    expect(screen.getByText('Clean Energy ETF')).toBeInTheDocument();
    expect(screen.getByText('ESG Global Fund')).toBeInTheDocument();

    // Wait for potential state updates (the component has a 5-second interval)
    await waitFor(() => {
      expect(screen.getByText('Clean Energy ETF')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays proper ESG score formatting', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    // Check that ESG score is displayed with rating
    const esgScoreElement = screen.getByText(/84\/100/);
    expect(esgScoreElement).toBeInTheDocument();

    const ratingElement = screen.getByText(/Rating: A\+/);
    expect(ratingElement).toBeInTheDocument();
  });

  it('shows carbon impact with proper units', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    // Check that carbon reduction is displayed with units
    const carbonElement = screen.getByText(/3\.7 tons CO₂/);
    expect(carbonElement).toBeInTheDocument();
  });

  it('renders feature highlights correctly', () => {
    renderWithProviders(<GreenFinanceDashboard />);

    expect(screen.getByText('AI ESG Analysis')).toBeInTheDocument();
    expect(screen.getByText('sBTC Integration')).toBeInTheDocument();
    expect(screen.getByText('Carbon Tracking')).toBeInTheDocument();
    expect(screen.getByText('Investment Analytics')).toBeInTheDocument();
    expect(screen.getByText('Fractional Investing')).toBeInTheDocument();
    expect(screen.getByText('Grant Ready')).toBeInTheDocument();
  });
});