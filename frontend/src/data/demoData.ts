export interface ESGScore {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

export interface CompanyESGData {
  companyName: string;
  ticker: string;
  sector: string;
  marketCap: string;
  esgScores: ESGScore;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  confidence: number;
  lastUpdated: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface InvestmentRecommendation {
  id: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'fund';
  symbol: string;
  sector: string;
  esgScore: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  minimumInvestment: number;
  description: string;
  sustainabilityFocus: string[];
  carbonImpact: number; // tons CO2 saved per $1000 invested
  matchScore: number; // 0-100
}

export interface CarbonData {
  totalFootprint: number; // tons CO2 per year
  offsetsPurchased: number;
  netFootprint: number;
  breakdown: {
    category: string;
    emissions: number;
    percentage: number;
  }[];
  monthlyData: {
    month: string;
    emissions: number;
    offsets: number;
    net: number;
  }[];
}

export interface GreenInvestment {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  initialInvestment: number;
  returns: number;
  esgImpact: {
    carbonSaved: number;
    waterSaved: number;
    renewableEnergyGenerated: number;
  };
  performance: {
    month: string;
    value: number;
    return: number;
  }[];
}

export interface DashboardMetrics {
  totalPortfolioValue: number;
  totalReturns: number;
  avgESGScore: number;
  carbonFootprintReduction: number;
  activeInvestments: number;
  sustainabilityRating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C';
}

// Demo ESG Company Data
export const demoESGCompanies: CompanyESGData[] = [
  {
    companyName: 'Tesla Inc.',
    ticker: 'TSLA',
    sector: 'Automotive',
    marketCap: '$800.5B',
    esgScores: {
      environmental: 92,
      social: 78,
      governance: 71,
      overall: 80
    },
    analysis: {
      strengths: [
        'Leading electric vehicle innovation',
        'Renewable energy integration',
        'Battery technology advancement',
        'Carbon footprint reduction'
      ],
      weaknesses: [
        'Governance structure concerns',
        'Worker safety incidents',
        'Limited board diversity',
        'CEO compensation issues'
      ],
      recommendations: [
        'Improve board independence',
        'Enhance workplace safety programs',
        'Increase transparency in governance',
        'Diversify leadership team'
      ]
    },
    confidence: 0.87,
    lastUpdated: '2024-03-15',
    trend: 'improving'
  },
  {
    companyName: 'Microsoft Corporation',
    ticker: 'MSFT',
    sector: 'Technology',
    marketCap: '$2.8T',
    esgScores: {
      environmental: 88,
      social: 85,
      governance: 89,
      overall: 87
    },
    analysis: {
      strengths: [
        'Carbon negative by 2030 commitment',
        'Strong diversity and inclusion programs',
        'Excellent corporate governance',
        'Sustainable cloud computing initiatives'
      ],
      weaknesses: [
        'High energy consumption from data centers',
        'Limited renewable energy in some regions',
        'Supply chain sustainability gaps'
      ],
      recommendations: [
        'Accelerate renewable energy adoption',
        'Enhance supply chain monitoring',
        'Increase climate risk disclosure',
        'Expand green technology investments'
      ]
    },
    confidence: 0.92,
    lastUpdated: '2024-03-14',
    trend: 'stable'
  },
  {
    companyName: 'NextEra Energy',
    ticker: 'NEE',
    sector: 'Utilities',
    marketCap: '$155.2B',
    esgScores: {
      environmental: 95,
      social: 82,
      governance: 86,
      overall: 88
    },
    analysis: {
      strengths: [
        'Largest renewable energy generator in US',
        'Strong environmental performance',
        'Clean energy transition leadership',
        'Grid modernization investments'
      ],
      weaknesses: [
        'Still operates some natural gas plants',
        'Rate increases affecting low-income customers',
        'Environmental permitting challenges'
      ],
      recommendations: [
        'Accelerate fossil fuel phase-out',
        'Implement low-income assistance programs',
        'Enhance environmental impact assessments',
        'Improve stakeholder engagement'
      ]
    },
    confidence: 0.89,
    lastUpdated: '2024-03-16',
    trend: 'improving'
  }
];

// Demo Investment Recommendations
export const demoInvestmentRecommendations: InvestmentRecommendation[] = [
  {
    id: 'rec-001',
    name: 'iShares Global Clean Energy ETF',
    type: 'etf',
    symbol: 'ICLN',
    sector: 'Renewable Energy',
    esgScore: 89,
    expectedReturn: 12.5,
    riskLevel: 'medium',
    minimumInvestment: 100,
    description: 'Diversified exposure to clean energy companies worldwide, focusing on solar, wind, and battery technologies.',
    sustainabilityFocus: ['Solar Energy', 'Wind Power', 'Energy Storage', 'Grid Infrastructure'],
    carbonImpact: 2.3,
    matchScore: 94
  },
  {
    id: 'rec-002',
    name: 'Vanguard ESG International Stock ETF',
    type: 'etf',
    symbol: 'VSGX',
    sector: 'Diversified',
    esgScore: 82,
    expectedReturn: 8.7,
    riskLevel: 'low',
    minimumInvestment: 50,
    description: 'International developed market exposure with ESG screening, excluding companies with poor sustainability practices.',
    sustainabilityFocus: ['ESG Screening', 'International Diversification', 'Sustainable Practices'],
    carbonImpact: 1.8,
    matchScore: 87
  },
  {
    id: 'rec-003',
    name: 'Beyond Meat Inc.',
    type: 'stock',
    symbol: 'BYND',
    sector: 'Food Technology',
    esgScore: 91,
    expectedReturn: 15.2,
    riskLevel: 'high',
    minimumInvestment: 200,
    description: 'Plant-based meat substitute company reducing agricultural carbon footprint and promoting sustainable food systems.',
    sustainabilityFocus: ['Plant-Based Foods', 'Reduced Agriculture Impact', 'Food Innovation'],
    carbonImpact: 3.7,
    matchScore: 78
  },
  {
    id: 'rec-004',
    name: 'Green Bond Fund',
    type: 'bond',
    symbol: 'GRNBX',
    sector: 'Fixed Income',
    esgScore: 85,
    expectedReturn: 4.2,
    riskLevel: 'low',
    minimumInvestment: 1000,
    description: 'Investment-grade bonds financing environmental projects including renewable energy and clean transportation.',
    sustainabilityFocus: ['Green Infrastructure', 'Climate Projects', 'Sustainable Development'],
    carbonImpact: 1.2,
    matchScore: 91
  }
];

// Demo Carbon Data
export const demoCarbonData: CarbonData = {
  totalFootprint: 12.4,
  offsetsPurchased: 8.7,
  netFootprint: 3.7,
  breakdown: [
    { category: 'Transportation', emissions: 4.2, percentage: 34 },
    { category: 'Energy Consumption', emissions: 3.8, percentage: 31 },
    { category: 'Investment Portfolio', emissions: 2.1, percentage: 17 },
    { category: 'Consumer Goods', emissions: 1.5, percentage: 12 },
    { category: 'Food & Diet', emissions: 0.8, percentage: 6 }
  ],
  monthlyData: [
    { month: 'Jan', emissions: 1.2, offsets: 0.8, net: 0.4 },
    { month: 'Feb', emissions: 1.1, offsets: 1.0, net: 0.1 },
    { month: 'Mar', emissions: 1.0, offsets: 1.2, net: -0.2 },
    { month: 'Apr', emissions: 0.9, offsets: 1.1, net: -0.2 },
    { month: 'May', emissions: 1.0, offsets: 0.9, net: 0.1 },
    { month: 'Jun', emissions: 1.1, offsets: 1.0, net: 0.1 },
    { month: 'Jul', emissions: 1.3, offsets: 1.1, net: 0.2 },
    { month: 'Aug', emissions: 1.2, offsets: 1.0, net: 0.2 },
    { month: 'Sep', emissions: 1.0, offsets: 1.1, net: -0.1 },
    { month: 'Oct', emissions: 1.0, offsets: 0.8, net: 0.2 },
    { month: 'Nov', emissions: 0.9, offsets: 0.9, net: 0.0 },
    { month: 'Dec', emissions: 1.0, offsets: 1.0, net: 0.0 }
  ]
};

// Demo Green Investments
export const demoGreenInvestments: GreenInvestment[] = [
  {
    id: 'inv-001',
    name: 'Solar Power ETF',
    type: 'ETF',
    currentValue: 5420.30,
    initialInvestment: 5000,
    returns: 8.4,
    esgImpact: {
      carbonSaved: 2.3,
      waterSaved: 150000,
      renewableEnergyGenerated: 1200
    },
    performance: [
      { month: 'Jan', value: 5000, return: 0.0 },
      { month: 'Feb', value: 5150, return: 3.0 },
      { month: 'Mar', value: 5280, return: 5.6 },
      { month: 'Apr', value: 5320, return: 6.4 },
      { month: 'May', value: 5420, return: 8.4 }
    ]
  },
  {
    id: 'inv-002',
    name: 'Clean Water Fund',
    type: 'Mutual Fund',
    currentValue: 3265.80,
    initialInvestment: 3000,
    returns: 8.9,
    esgImpact: {
      carbonSaved: 1.1,
      waterSaved: 75000,
      renewableEnergyGenerated: 0
    },
    performance: [
      { month: 'Jan', value: 3000, return: 0.0 },
      { month: 'Feb', value: 3120, return: 4.0 },
      { month: 'Mar', value: 3195, return: 6.5 },
      { month: 'Apr', value: 3230, return: 7.7 },
      { month: 'May', value: 3265, return: 8.9 }
    ]
  }
];

// Demo Dashboard Metrics
export const demoDashboardMetrics: DashboardMetrics = {
  totalPortfolioValue: 48650.30,
  totalReturns: 12.7,
  avgESGScore: 84,
  carbonFootprintReduction: 3.7,
  activeInvestments: 8,
  sustainabilityRating: 'A+'
};

// Market Performance Data
export const demoMarketData = {
  sustainableIndices: [
    { name: 'MSCI KLD 400 Social', value: 1247.8, change: 2.3, changePercent: 0.18 },
    { name: 'Dow Jones Sustainability Index', value: 2834.5, change: -8.7, changePercent: -0.31 },
    { name: 'FTSE4Good', value: 892.1, change: 12.4, changePercent: 1.41 },
    { name: 'S&P 500 ESG', value: 1567.9, change: 5.2, changePercent: 0.33 }
  ],
  sectorPerformance: [
    { sector: 'Renewable Energy', performance: 15.2, esgScore: 89 },
    { sector: 'Clean Technology', performance: 12.8, esgScore: 87 },
    { sector: 'Sustainable Agriculture', performance: 8.4, esgScore: 82 },
    { sector: 'Water Management', performance: 6.7, esgScore: 85 },
    { sector: 'Green Building', performance: 11.3, esgScore: 80 }
  ]
};

// News and Updates
export const demoNewsData = [
  {
    id: 'news-001',
    title: 'Global Renewable Energy Investment Reaches Record High',
    summary: 'Renewable energy investments surpassed $300 billion in Q1 2024, driven by solar and wind projects.',
    category: 'Market News',
    impact: 'positive',
    date: '2024-03-16',
    source: 'Bloomberg Green'
  },
  {
    id: 'news-002',
    title: 'New ESG Disclosure Requirements Take Effect',
    summary: 'Enhanced ESG reporting standards now mandatory for public companies over $1B market cap.',
    category: 'Regulation',
    impact: 'neutral',
    date: '2024-03-15',
    source: 'Financial Times'
  },
  {
    id: 'news-003',
    title: 'Carbon Credit Prices Surge Amid Increased Demand',
    summary: 'Voluntary carbon credit prices up 40% as companies accelerate net-zero commitments.',
    category: 'Carbon Markets',
    impact: 'positive',
    date: '2024-03-14',
    source: 'Reuters'
  }
];

// AI Analysis Examples
export const demoAIAnalysis = {
  portfolioInsights: [
    'Your portfolio shows strong alignment with renewable energy trends, with 67% exposure to clean technology sectors.',
    'Consider rebalancing towards water management and sustainable agriculture for better diversification.',
    'Current ESG score of 84 positions you in the top 15% of sustainable investors.',
    'Carbon footprint reduction of 3.7 tons annually exceeds the platform average by 40%.'
  ],
  riskAssessment: {
    overall: 'Medium',
    factors: [
      { factor: 'Market Volatility', level: 'Medium', impact: 'Moderate price fluctuations expected' },
      { factor: 'Regulatory Changes', level: 'Low', impact: 'Favorable policy environment for ESG investments' },
      { factor: 'Sector Concentration', level: 'Medium', impact: 'Diversification recommended for risk reduction' },
      { factor: 'ESG Transition Risk', level: 'Low', impact: 'Well-positioned for sustainable transition' }
    ]
  },
  futureProjections: {
    shortTerm: 'Expected 6-8% returns over next 12 months with moderate volatility',
    mediumTerm: 'Strong growth potential as ESG adoption accelerates globally',
    longTerm: 'Positioned for outperformance as sustainability becomes mainstream'
  }
};

// Export all demo data
export const DemoData = {
  esgCompanies: demoESGCompanies,
  investmentRecommendations: demoInvestmentRecommendations,
  carbonData: demoCarbonData,
  greenInvestments: demoGreenInvestments,
  dashboardMetrics: demoDashboardMetrics,
  marketData: demoMarketData,
  newsData: demoNewsData,
  aiAnalysis: demoAIAnalysis
};