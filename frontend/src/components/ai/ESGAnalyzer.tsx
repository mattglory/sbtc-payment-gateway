import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Leaf,
  Users,
  Shield,
  Brain,
  Zap,
  Loader,
  Building2
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ESGScores {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

interface ESGAnalysis {
  environmental: string;
  social: string;
  governance: string;
  summary: string;
  risks: string[];
  opportunities: string[];
}

interface CompanyAnalysis {
  company: {
    name: string;
    sector: string;
  };
  esgScores: ESGScores;
  analysis: ESGAnalysis;
  timestamp: string;
}

interface FormData {
  companyName: string;
  sector: string;
  description: string;
}

const ESGAnalyzer: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    sector: '',
    description: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<CompanyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<CompanyAnalysis[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const analyzeCompany = async () => {
    if (!formData.companyName.trim() || !formData.sector.trim() || !formData.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/esg-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'demo-token'}`
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          sector: formData.sector,
          description: formData.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze company');
      }

      const analysisData = await response.json();

      if (analysisData.success) {
        setCurrentAnalysis(analysisData);

        // Add to recent analyses
        setRecentAnalyses(prev => [analysisData, ...prev.slice(0, 4)]);

        // Clear form after successful analysis
        setFormData({
          companyName: '',
          sector: '',
          description: ''
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getRating = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'D';
  };

  const commonSectors = [
    'Technology',
    'Financial Services',
    'Healthcare',
    'Energy',
    'Manufacturing',
    'Retail',
    'Transportation',
    'Real Estate',
    'Telecommunications',
    'Utilities',
    'Consumer Goods',
    'Media & Entertainment'
  ];

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold">AI-Powered ESG Analysis</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get comprehensive Environmental, Social, and Governance scores powered by OpenAI GPT-4
        </p>
      </div>

      {/* Analysis Form */}
      <div className={`rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-blue-600" />
          Company Analysis Form
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="e.g., Tesla, Inc."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isAnalyzing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Industry Sector *
            </label>
            <select
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isAnalyzing}
            >
              <option value="">Select a sector...</option>
              {commonSectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Company Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Provide a detailed description of the company's business model, operations, and key activities..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={isAnalyzing}
          />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={analyzeCompany}
            disabled={isAnalyzing || !formData.companyName || !formData.sector || !formData.description}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              isAnalyzing || !formData.companyName || !formData.sector || !formData.description
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyze ESG Scores
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {currentAnalysis && (
        <div className={`rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              ESG Analysis: {currentAnalysis.company.name}
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(currentAnalysis.timestamp).toLocaleDateString()}
            </span>
          </div>

          {/* ESG Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <Leaf className="w-6 h-6 text-green-600" />
                {getScoreIcon(currentAnalysis.esgScores.environmental)}
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {currentAnalysis.esgScores.environmental}
              </div>
              <div className="text-sm text-gray-600">Environmental</div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                {getScoreIcon(currentAnalysis.esgScores.social)}
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {currentAnalysis.esgScores.social}
              </div>
              <div className="text-sm text-gray-600">Social</div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
                {getScoreIcon(currentAnalysis.esgScores.governance)}
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {currentAnalysis.esgScores.governance}
              </div>
              <div className="text-sm text-gray-600">Governance</div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-yellow-600" />
                <span className="text-lg font-semibold text-yellow-600">
                  {getRating(currentAnalysis.esgScores.overall)}
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {currentAnalysis.esgScores.overall}
              </div>
              <div className="text-sm text-gray-600">Overall ESG</div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
              <p className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {currentAnalysis.analysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-md font-semibold mb-2 text-green-600">Environmental Analysis</h4>
                <p className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
                  {currentAnalysis.analysis.environmental}
                </p>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-2 text-blue-600">Social Analysis</h4>
                <p className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  {currentAnalysis.analysis.social}
                </p>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-2 text-purple-600">Governance Analysis</h4>
                <p className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}>
                  {currentAnalysis.analysis.governance}
                </p>
              </div>
            </div>

            {/* Risks and Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold mb-3 text-red-600">Key Risks</h4>
                <ul className="space-y-2">
                  {currentAnalysis.analysis.risks.map((risk, index) => (
                    <li key={index} className={`p-3 rounded-lg text-sm flex items-start ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}>
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-green-600">Opportunities</h4>
                <ul className="space-y-2">
                  {currentAnalysis.analysis.opportunities.map((opportunity, index) => (
                    <li key={index} className={`p-3 rounded-lg text-sm flex items-start ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
                      <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className={`rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h3 className="text-xl font-semibold mb-4">Recent Analyses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAnalyses.map((analysis, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-colors hover:bg-opacity-80 ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setCurrentAnalysis(analysis)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm truncate">{analysis.company.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${getScoreColor(analysis.esgScores.overall)}`}>
                    {getRating(analysis.esgScores.overall)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{analysis.company.sector}</div>
                <div className="text-lg font-bold">{analysis.esgScores.overall}/100</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ESGAnalyzer;