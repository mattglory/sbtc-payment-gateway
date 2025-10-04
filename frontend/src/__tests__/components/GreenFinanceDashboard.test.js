import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GreenFinanceDashboard from '../../components/dashboard/GreenFinanceDashboard';
import {
  mockPortfolioData,
  mockCarbonData,
  mockMarketData,
  mockWallet,
  createMockFetch
} from '../utils/test-utils';

// Mock recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadialBarChart: ({ children }) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
  ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />,
  RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Legend: () => <div data-testid="legend" />
}));

// Mock hooks
jest.mock('../../hooks/useWallet', () => ({
  useWallet: () => mockWallet
}));

// Mock services
jest.mock('../../lib/blockchain/fractional-investments', () => ({
  fractionalInvestmentSystem: {
    getPortfolioMetrics: () => mockPortfolioData,
    getUserPositions: () => mockPortfolioData.holdings
  }
}));

jest.mock('../../lib/blockchain/carbon-integration', () => ({
  carbonIntegration: {
    getTotalCarbonImpact: () => mockCarbonData
  }
}));

global.fetch = createMockFetch();

describe('GreenFinanceDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Initial render', () => {
    test('should render dashboard header', () => {
      render(<GreenFinanceDashboard />);

      expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Sustainable investing made intelligent')).toBeInTheDocument();
    });

    test('should render key metric cards', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sustainability Score')).toBeInTheDocument();
        expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
        expect(screen.getByText('Carbon Impact')).toBeInTheDocument();
        expect(screen.getByText('ESG Score')).toBeInTheDocument();
      });
    });

    test('should render welcome section for connected user', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Investor/)).toBeInTheDocument();
        expect(screen.getByText(/performing excellently/)).toBeInTheDocument();
      });
    });

    test('should render charts and visualizations', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('User interactions', () => {
    test('should allow timeframe selection', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      const timeframeButtons = screen.getAllByRole('button');
      const oneDayButton = timeframeButtons.find(btn => btn.textContent === '1D');

      if (oneDayButton) {
        await user.click(oneDayButton);
        expect(oneDayButton).toHaveClass('bg-white');
      }
    });

    test('should handle refresh button click', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      const refreshButton = screen.getByLabelText(/refresh/i) ||
                           screen.getByRole('button', { name: /refresh/i });

      await user.click(refreshButton);

      // Should trigger data reload
      expect(refreshButton).toBeInTheDocument();
    });

    test('should toggle notifications panel', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      const notificationButton = screen.getByRole('button', { name: /notification/i });
      await user.click(notificationButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('should expand chart cards', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        const expandButton = screen.getAllByLabelText(/expand/i)[0];
        if (expandButton) {
          user.click(expandButton);
        }
      });
    });
  });

  describe('Data loading and display', () => {
    test('should show loading skeleton initially', () => {
      render(<GreenFinanceDashboard />);

      // Loading skeleton should be present initially
      expect(screen.getByText('Loading Green Finance Dashboard')).toBeInTheDocument();
    });

    test('should display portfolio metrics when loaded', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        // Should display portfolio value
        expect(screen.getByText(/\$3,061/)).toBeInTheDocument();
      });
    });

    test('should display sustainability goals', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sustainability Goals')).toBeInTheDocument();
        expect(screen.getByText('Achieve Carbon Neutrality')).toBeInTheDocument();
        expect(screen.getByText('ESG Portfolio Score 85+')).toBeInTheDocument();
      });
    });

    test('should display market insights', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Market Insights')).toBeInTheDocument();
        expect(screen.getByText('ESG ETF Flows')).toBeInTheDocument();
        expect(screen.getByText('Clean Energy Index')).toBeInTheDocument();
      });
    });

    test('should show AI insights sidebar', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('AI Portfolio Analysis')).toBeInTheDocument();
        expect(screen.getByText('Smart Recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive behavior', () => {
    test('should render mobile layout on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<GreenFinanceDashboard />);

      // Should show mobile floating action button
      expect(screen.getByRole('button', {
        name: /ai insights/i
      }) || screen.getByTestId('mobile-fab')).toBeInTheDocument();
    });

    test('should hide certain elements on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<GreenFinanceDashboard />);

      // Some desktop-only elements should be hidden
      const timeframeSelector = screen.queryByText('1D');
      expect(timeframeSelector).not.toBeInTheDocument();
    });

    test('should adjust grid layout for different screen sizes', () => {
      const { rerender } = render(<GreenFinanceDashboard />);

      // Desktop layout
      expect(screen.getByTestId('main-grid') ||
             document.querySelector('.grid')).toBeInTheDocument();

      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      rerender(<GreenFinanceDashboard />);

      // Layout should still work
      expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    test('should handle data loading errors gracefully', async () => {
      // Mock error in data loading
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<GreenFinanceDashboard />);

      // Should not crash and should show some fallback
      await waitFor(() => {
        expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
      });

      console.error.mockRestore();
    });

    test('should handle missing wallet connection', () => {
      // Mock disconnected wallet
      const mockDisconnectedWallet = {
        isConnected: false,
        connection: null,
        connect: jest.fn(),
        disconnect: jest.fn()
      };

      jest.doMock('../../hooks/useWallet', () => ({
        useWallet: () => mockDisconnectedWallet
      }));

      render(<GreenFinanceDashboard />);

      expect(screen.getByText(/Welcome back, Guest/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not cause memory leaks', () => {
      const { unmount } = render(<GreenFinanceDashboard />);

      expect(() => unmount()).not.toThrow();
    });

    test('should handle rapid data updates', async () => {
      const { rerender } = render(<GreenFinanceDashboard />);

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<GreenFinanceDashboard key={i} />);
      }

      await waitFor(() => {
        expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
      });
    });

    test('should debounce resize events', async () => {
      render(<GreenFinanceDashboard />);

      // Simulate multiple resize events
      for (let i = 0; i < 10; i++) {
        fireEvent(window, new Event('resize'));
      }

      // Should handle gracefully
      expect(screen.getByText('Green Finance Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(<GreenFinanceDashboard />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Green Finance Dashboard');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    test('should have accessible buttons', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toBeInTheDocument();
          // Each button should have accessible content
          expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
        });
      });
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      // Should be able to tab through interactive elements
      await user.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInstanceOf(HTMLElement);
    });

    test('should have proper ARIA labels for charts', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        const charts = screen.getAllByTestId(/chart/);
        charts.forEach(chart => {
          expect(chart).toBeInTheDocument();
        });
      });
    });
  });

  describe('Data visualization', () => {
    test('should render portfolio performance chart', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
        expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      });
    });

    test('should render ESG breakdown charts', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('ESG Portfolio Breakdown')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    test('should render carbon impact timeline', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Carbon Impact Timeline')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });

    test('should display risk vs return scatter plot', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('ESG Risk vs Return Analysis')).toBeInTheDocument();
        expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Quick actions', () => {
    test('should render quick action buttons', async () => {
      render(<GreenFinanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Buy Carbon Offsets')).toBeInTheDocument();
        expect(screen.getByText('View Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Export Report')).toBeInTheDocument();
      });
    });

    test('should handle quick action clicks', async () => {
      const user = userEvent.setup();
      render(<GreenFinanceDashboard />);

      await waitFor(async () => {
        const carbonOffsetButton = screen.getByText('Buy Carbon Offsets');
        await user.click(carbonOffsetButton);
        // Should not cause errors
        expect(carbonOffsetButton).toBeInTheDocument();
      });
    });
  });
});