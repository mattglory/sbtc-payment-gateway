import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
  Tag,
  Globe,
  Bookmark,
  Share2,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  Star,
  BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';

const ESGNewsFeed = ({ data, isLoading }) => {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedArticles, setBookmarkedArticles] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  const categories = [
    { id: 'all', name: 'All News', icon: Globe },
    { id: 'esg', name: 'ESG Scores', icon: Star },
    { id: 'climate', name: 'Climate Finance', icon: TrendingUp },
    { id: 'green-bonds', name: 'Green Bonds', icon: BarChart3 },
    { id: 'sustainable', name: 'Sustainable Investing', icon: Bookmark },
    { id: 'regulations', name: 'Regulations', icon: Tag }
  ];

  const mockNews = [
    {
      id: 1,
      title: "Global Green Bond Issuance Hits Record $500B in 2024",
      summary: "The green bond market continues its explosive growth as corporations and governments increase sustainable financing initiatives.",
      category: 'green-bonds',
      source: 'Bloomberg Green',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      url: 'https://bloomberg.com/example',
      sentiment: 'positive',
      impact: 'high',
      tags: ['green bonds', 'climate finance', 'sustainability'],
      readTime: 3,
      image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Green+Bonds'
    },
    {
      id: 2,
      title: "EU Taxonomy Regulation Updates Affect ESG Investing",
      summary: "New guidelines from the European Union could reshape how asset managers approach sustainable investment strategies.",
      category: 'regulations',
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      url: 'https://ft.com/example',
      sentiment: 'neutral',
      impact: 'high',
      tags: ['EU taxonomy', 'regulations', 'ESG'],
      readTime: 5,
      image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=EU+Taxonomy'
    },
    {
      id: 3,
      title: "Tesla's ESG Score Improves Following Governance Changes",
      summary: "Rating agencies upgrade Tesla's environmental and governance metrics after implementing new board diversity initiatives.",
      category: 'esg',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      url: 'https://reuters.com/example',
      sentiment: 'positive',
      impact: 'medium',
      tags: ['Tesla', 'ESG scores', 'governance'],
      readTime: 4,
      image: 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Tesla+ESG'
    },
    {
      id: 4,
      title: "Climate Risk Assessment Becomes Mandatory for Banks",
      summary: "New regulations require financial institutions to conduct comprehensive climate stress tests and disclosure requirements.",
      category: 'regulations',
      source: 'Wall Street Journal',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      url: 'https://wsj.com/example',
      sentiment: 'neutral',
      impact: 'high',
      tags: ['climate risk', 'banks', 'stress tests'],
      readTime: 6,
      image: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Climate+Risk'
    },
    {
      id: 5,
      title: "Renewable Energy ETFs See $12B Inflow This Quarter",
      summary: "Investor appetite for clean energy investments continues strong despite market volatility and geopolitical tensions.",
      category: 'sustainable',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      url: 'https://cnbc.com/example',
      sentiment: 'positive',
      impact: 'medium',
      tags: ['renewable energy', 'ETFs', 'clean energy'],
      readTime: 3,
      image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Clean+Energy'
    },
    {
      id: 6,
      title: "Carbon Credit Prices Surge 40% Amid Increased Demand",
      summary: "Corporate carbon neutrality commitments drive unprecedented demand for verified carbon offset credits globally.",
      category: 'climate',
      source: 'Carbon Tracker',
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      url: 'https://carbontracker.org/example',
      sentiment: 'positive',
      impact: 'high',
      tags: ['carbon credits', 'offsets', 'carbon pricing'],
      readTime: 4,
      image: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Carbon+Credits'
    }
  ];

  useEffect(() => {
    setNews(mockNews);
    setFilteredNews(mockNews);
  }, []);

  useEffect(() => {
    let filtered = news;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.publishedAt) - new Date(a.publishedAt);
        case 'impact':
          const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'sentiment':
          const sentimentOrder = { 'positive': 3, 'neutral': 2, 'negative': 1 };
          return sentimentOrder[b.sentiment] - sentimentOrder[a.sentiment];
        default:
          return 0;
      }
    });

    setFilteredNews(filtered);
  }, [news, selectedCategory, searchTerm, sortBy]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const handleBookmark = (articleId) => {
    const newBookmarks = new Set(bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
    } else {
      newBookmarks.add(articleId);
    }
    setBookmarkedArticles(newBookmarks);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const NewsCard = ({ article }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            getSentimentColor(article.sentiment)
          )}>
            {article.sentiment}
          </span>
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            getImpactColor(article.impact)
          )}>
            {article.impact} impact
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBookmark(article.id)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              bookmarkedArticles.has(article.id)
                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>

      <p className="text-gray-600 mb-4 line-clamp-3">
        {article.summary}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span className="font-medium">{article.source}</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(article.publishedAt)}</span>
          </div>
          <span>{article.readTime} min read</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {article.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ESG News Feed</h2>
            <p className="text-gray-600">Stay updated with the latest sustainable finance news</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="impact">Sort by Impact</option>
                <option value="sentiment">Sort by Sentiment</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors',
                selectedCategory === category.id
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              <category.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* News Articles */}
      <div className="space-y-6">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'No news articles available at the moment'
              }
            </p>
          </div>
        ) : (
          filteredNews.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))
        )}
      </div>

      {/* Load More */}
      {filteredNews.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg font-medium transition-colors">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
};

export default ESGNewsFeed;