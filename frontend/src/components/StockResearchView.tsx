// frontend/src/components/StockResearchView.tsx
import React, { useState, useEffect } from 'react';
import {
  Quote,
  TechnicalIndicators,
  Fundamentals,
  NewsArticle,
  SentimentData,
  AnalysisRecord,
} from '../types';
import { api } from '../api/client';
import { CandlestickChart } from './CandlestickChart';
import { TechnicalsTable } from './TechnicalsTable';
import { FundamentalsTable } from './FundamentalsTable';
import { NewsFeed } from './NewsFeed';
import { SentimentView } from './SentimentView';
import { DebateView } from './DebateView';
import { RiskView } from './RiskView';
import { DecisionView } from './DecisionView';
import { AIChatView } from './AIChatView';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  BarChart2,
  FileText,
  Newspaper,
  MessageSquare,
  Scale,
  ShieldAlert,
  Award,
  Clock,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';


interface StockResearchViewProps {
  symbol: string;
  onLaunchAnalysis: (symbol: string) => void;
  activeAnalysis: AnalysisRecord | null;
}

type TabKey =
  | 'overview'
  | 'technical'
  | 'fundamental'
  | 'news'
  | 'sentiment'
  | 'debate'
  | 'risk'
  | 'decision'
  | 'chat';

export const StockResearchView: React.FC<StockResearchViewProps> = ({
  symbol,
  onLaunchAnalysis,
  activeAnalysis,
}) => {
  const { t, translateProvenance } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  const [loadingQuote, setLoadingQuote] = useState<boolean>(true);
  const [loadingTech, setLoadingTech] = useState<boolean>(false);
  const [loadingFund, setLoadingFund] = useState<boolean>(false);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [loadingSent, setLoadingSent] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuote = async () => {
      setLoadingQuote(true);
      try {
        const q = await api.getStockOverview(symbol);
        if (isMounted) setQuote(q);
      } catch (err) {
        console.error('Failed to load quote:', err);
      } finally {
        if (isMounted) setLoadingQuote(false);
      }
    };

    loadQuote();

    // Lazy load tabs as needed or initial overview
    loadTechData();
    loadFundData();
    loadNewsData();
    loadSentimentData();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const loadTechData = async () => {
    setLoadingTech(true);
    try {
      const t = await api.getStockTechnicals(symbol);
      setTechnicals(t);
    } catch (err) {
      console.error('Tech error:', err);
    } finally {
      setLoadingTech(false);
    }
  };

  const loadFundData = async () => {
    setLoadingFund(true);
    try {
      const f = await api.getStockFundamentals(symbol);
      setFundamentals(f);
    } catch (err) {
      console.error('Fund error:', err);
    } finally {
      setLoadingFund(false);
    }
  };

  const loadNewsData = async () => {
    setLoadingNews(true);
    try {
      const n = await api.getStockNews(symbol);
      setNews(n);
    } catch (err) {
      console.error('News error:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const loadSentimentData = async () => {
    setLoadingSent(true);
    try {
      const s = await api.getStockSentiment(symbol);
      setSentiment(s);
    } catch (err) {
      console.error('Sentiment error:', err);
    } finally {
      setLoadingSent(false);
    }
  };

  const isPos = (quote?.change ?? 0) >= 0;

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: t('tab.overview', 'Overview & Charts'), icon: <BarChart2 size={15} /> },
    { key: 'technical', label: t('tab.technical', 'Technical Analysis'), icon: <TrendingUp size={15} /> },
    { key: 'fundamental', label: t('tab.fundamental', 'Fundamental Analysis'), icon: <FileText size={15} /> },
    { key: 'news', label: t('tab.news', 'News Feed'), icon: <Newspaper size={15} /> },
    { key: 'sentiment', label: t('tab.sentiment', 'Sentiment'), icon: <MessageSquare size={15} /> },
    { key: 'debate', label: t('tab.debate', 'Research Debate'), icon: <Scale size={15} /> },
    { key: 'risk', label: t('tab.risk', 'Risk Analysis'), icon: <ShieldAlert size={15} /> },
    { key: 'decision', label: t('tab.decision', 'AI Decision'), icon: <Award size={15} /> },
    { key: 'chat', label: t('tab.chat', 'AI Analyst Chat'), icon: <Bot size={15} /> },
  ];

  const handleOpenChat = (prompt?: string) => {
    if (prompt) {
      setChatPrompt(prompt);
    }
    setActiveTab('chat');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar for Selected Stock */}
      <div
        className="terminal-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.5rem',
          background: 'linear-gradient(180deg, #101520 0%, #0d111a 100%)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {symbol}
            </h1>
            <span className="pill pill-historical" style={{ fontSize: '0.72rem' }}>
              {quote?.exchange || 'NSE'}
            </span>
            {quote?.resolved_symbol && quote.resolved_symbol !== symbol && (
              <span
                className="pill pill-live"
                style={{
                  fontSize: '0.72rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {t('research.official_ticker', 'Official Ticker')}: {quote.resolved_symbol}
              </span>
            )}
            {quote?.provenance && (
              <span
                className={`pill ${
                  quote.provenance.status === 'LIVE' ? 'pill-live' : 'pill-historical'
                }`}
              >
                {translateProvenance(quote.provenance.status)}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {loadingQuote
              ? t('research.loading_details', 'Loading company details...')
              : (quote?.company_name || symbol)}
            {quote?.resolved_symbol && quote.resolved_symbol !== symbol && (
              <span style={{ color: '#38bdf8', fontSize: '0.82rem' }}> ({t('research.matched_from', 'Matched from')} {symbol})</span>
            )}
            {quote?.sector && <span style={{ color: 'var(--text-muted)' }}> • {quote.sector}</span>}
          </div>
        </div>

        {/* Price Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {t('research.last_traded_price', 'LAST TRADED PRICE')}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loadingQuote
                ? '...'
                : quote?.price != null
                ? `₹${quote.price.toLocaleString('en-IN')}`
                : t('research.unavailable', 'Unavailable')}
            </div>
            <div
              style={{
                color: isPos ? 'var(--color-bullish)' : 'var(--color-bearish)',
                fontWeight: 700,
                fontSize: '0.88rem',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {quote?.change ? `${isPos ? '+' : ''}${quote.change.toFixed(2)}` : '0.00'}{' '}
              ({quote?.change_percent ? `${isPos ? '+' : ''}${quote.change_percent.toFixed(2)}%` : '0.00%'})
            </div>
          </div>

          {/* Action to launch AI research */}
          <button
            className="btn-primary"
            style={{ padding: '12px 20px', fontSize: '0.9rem' }}
            onClick={() => onLaunchAnalysis(symbol)}
          >
            <Cpu size={16} /> {t('research.run_analysis', 'Run AI Research Analysis')}
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="terminal-nav" style={{ background: 'transparent', padding: '0 0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Metrics Bar */}
          <div className="grid-4" style={{ marginBottom: '1rem' }}>
            <div className="terminal-card">
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('watchlist.col_day_range', 'DAY RANGE')}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                ₹{quote?.day_low ?? 'N/A'} - ₹{quote?.day_high ?? 'N/A'}
              </div>
            </div>
            <div className="terminal-card">
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('watchlist.col_52w_range', '52-WEEK RANGE')}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                ₹{quote?.week_52_low ?? 'N/A'} - ₹{quote?.week_52_high ?? 'N/A'}
              </div>
            </div>
            <div className="terminal-card">
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                VOLUME
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {quote?.volume ? quote.volume.toLocaleString('en-IN') : 'N/A'}
              </div>
            </div>
            <div className="terminal-card">
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                P/E RATIO (TTM)
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {quote?.pe_ratio ? `${quote.pe_ratio.toFixed(2)}x` : 'N/A'}
              </div>
            </div>
          </div>

          <CandlestickChart symbol={symbol} />
        </div>
      )}


      {activeTab === 'technical' && (
        <TechnicalsTable technicals={technicals} loading={loadingTech} />
      )}

      {activeTab === 'fundamental' && (
        <FundamentalsTable fundamentals={fundamentals} loading={loadingFund} />
      )}

      {activeTab === 'news' && (
        <NewsFeed articles={news} loading={loadingNews} />
      )}

      {activeTab === 'sentiment' && (
        <SentimentView sentiment={sentiment} loading={loadingSent} />
      )}

      {activeTab === 'debate' && (
        <DebateView analysis={activeAnalysis} />
      )}

      {activeTab === 'risk' && (
        <RiskView analysis={activeAnalysis} />
      )}

      {activeTab === 'decision' && (
        <DecisionView analysis={activeAnalysis} onNavigateToChat={handleOpenChat} />
      )}

      {activeTab === 'chat' && (
        <AIChatView
          symbol={symbol}
          quote={quote}
          activeAnalysis={activeAnalysis}
          technicals={technicals}
          fundamentals={fundamentals}
          news={news}
          sentiment={sentiment}
          initialPrompt={chatPrompt}
        />
      )}
    </div>
  );
};
