// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import {
  AnalysisRecord,
  DataSourceItem,
  EvaluationRecord,
  MarketOverview,
  WatchlistItem,
} from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { StockResearchView } from './components/StockResearchView';
import { WatchlistView } from './components/WatchlistView';
import { EvaluationView } from './components/EvaluationView';
import { HistoryView } from './components/HistoryView';
import { DataSourcesView } from './components/DataSourcesView';
import { AnalysisModal } from './components/AnalysisModal';
import {
  LayoutDashboard,
  Search,
  Star,
  BarChart3,
  History,
  Database,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

type NavView = 'dashboard' | 'research' | 'watchlist' | 'evaluations' | 'history' | 'sources';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavView>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE.NS');
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisRecord | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);

  const [loadingSources, setLoadingSources] = useState<boolean>(false);
  const [analysisModalJob, setAnalysisModalJob] = useState<{ id: string; symbol: string } | null>(null);

  const loadData = async () => {
    try {
      const [ov, wl, ev, an, ds] = await Promise.allSettled([
        api.getMarketOverview(),
        api.getWatchlist(),
        api.getEvaluations(),
        api.getAnalysisHistory(),
        api.getDataSources(),
      ]);

      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (wl.status === 'fulfilled') setWatchlist(wl.value);
      if (ev.status === 'fulfilled') setEvaluations(ev.value);
      if (an.status === 'fulfilled') {
        setAnalyses(an.value);
        // Find most recent analysis for current symbol
        const found = an.value.find((a) => a.symbol === selectedSymbol);
        if (found) setActiveAnalysis(found);
      }
      if (ds.status === 'fulfilled') setDataSources(ds.value);
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.getMarketOverview().then(setOverview).catch(() => {});
    }, 60000); // 1-minute market overview refresh
    return () => clearInterval(interval);
  }, []);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    // Find if previous analysis exists
    const prev = analyses.find((a) => a.symbol === sym);
    setActiveAnalysis(prev || null);
    setActiveNav('research');
  };

  const handleLaunchAnalysis = async (sym: string) => {
    try {
      const res = await api.startAnalysis(sym);
      setAnalysisModalJob({ id: res.job_id, symbol: sym });
    } catch (err) {
      alert(`Failed to start analysis: ${err}`);
    }
  };

  const handleAnalysisCompleted = async (analysisId: string) => {
    try {
      const detail = await api.getAnalysisDetail(analysisId);
      setActiveAnalysis(detail);
      setAnalyses((prev) => [detail, ...prev.filter((a) => a.id !== detail.id)]);
      setActiveNav('research');
      // Refresh evaluations
      api.getEvaluations().then(setEvaluations).catch(() => {});
    } catch (err) {
      console.error('Failed to load completed analysis detail:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header & Ticker Tape */}
      <Header
        overview={overview}
        onSelectSymbol={handleSelectSymbol}
        selectedSymbol={selectedSymbol}
      />

      {/* Main Terminal Navigation */}
      <nav className="terminal-nav">
        <button
          className={`nav-tab ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveNav('dashboard')}
        >
          <LayoutDashboard size={16} /> Market Dashboard
        </button>
        <button
          className={`nav-tab ${activeNav === 'research' ? 'active' : ''}`}
          onClick={() => setActiveNav('research')}
        >
          <Search size={16} /> Stock Research ({selectedSymbol})
        </button>
        <button
          className={`nav-tab ${activeNav === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveNav('watchlist')}
        >
          <Star size={16} /> Watchlist ({watchlist.length})
        </button>
        <button
          className={`nav-tab ${activeNav === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveNav('evaluations')}
        >
          <BarChart3 size={16} /> AI Decision Tracking ({evaluations.length})
        </button>
        <button
          className={`nav-tab ${activeNav === 'history' ? 'active' : ''}`}
          onClick={() => setActiveNav('history')}
        >
          <History size={16} /> Analysis Archive ({analyses.length})
        </button>
        <button
          className={`nav-tab ${activeNav === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveNav('sources')}
        >
          <Database size={16} /> Data Sources & Infrastructure
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-view">
        {activeNav === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Market Overview Index Cards */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Indian Benchmark Indices
                </h2>
                <span className="pill pill-historical" style={{ fontSize: '0.72rem' }}>
                  NSE / BSE Official
                </span>
              </div>

              <div className="grid-4">
                {overview?.indices.map((idx) => {
                  const isPos = (idx.change ?? 0) >= 0;
                  return (
                    <div
                      key={idx.symbol}
                      className="terminal-card"
                      onClick={() => handleSelectSymbol(idx.symbol)}
                      style={{ cursor: 'pointer', borderTop: `3px solid ${isPos ? 'var(--color-bullish)' : 'var(--color-bearish)'}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{idx.name}</span>
                        <span className={`pill ${idx.provenance.status === 'LIVE' ? 'pill-live' : 'pill-historical'}`} style={{ fontSize: '0.65rem' }}>
                          {idx.provenance.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' }}>
                        {idx.price ? `₹${idx.price.toLocaleString('en-IN')}` : 'N/A'}
                      </div>

                      <div
                        style={{
                          color: isPos ? 'var(--color-bullish)' : 'var(--color-bearish)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                        }}
                      >
                        {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {idx.change ? `${isPos ? '+' : ''}${idx.change.toFixed(2)}` : '0.00'}{' '}
                        ({idx.change_percent ? `${isPos ? '+' : ''}${idx.change_percent.toFixed(2)}%` : '0.00%'})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Watchlist Snapshot on Dashboard */}
            <WatchlistView
              watchlist={watchlist}
              onSelectSymbol={handleSelectSymbol}
              onAnalyzeSymbol={handleLaunchAnalysis}
              onRefresh={() => api.getWatchlist().then(setWatchlist)}
            />
          </div>
        )}

        {activeNav === 'research' && (
          <StockResearchView
            symbol={selectedSymbol}
            onLaunchAnalysis={handleLaunchAnalysis}
            activeAnalysis={activeAnalysis}
          />
        )}

        {activeNav === 'watchlist' && (
          <WatchlistView
            watchlist={watchlist}
            onSelectSymbol={handleSelectSymbol}
            onAnalyzeSymbol={handleLaunchAnalysis}
            onRefresh={() => api.getWatchlist().then(setWatchlist)}
          />
        )}

        {activeNav === 'evaluations' && (
          <EvaluationView
            evaluations={evaluations}
            onRefresh={() => api.getEvaluations().then(setEvaluations)}
          />
        )}

        {activeNav === 'history' && (
          <HistoryView
            analyses={analyses}
            onSelectAnalysis={(item) => {
              setSelectedSymbol(item.symbol);
              setActiveAnalysis(item);
              setActiveNav('research');
            }}
          />
        )}

        {activeNav === 'sources' && (
          <DataSourcesView sources={dataSources} loading={loadingSources} />
        )}
      </main>

      {/* Analysis SSE Modal */}
      {analysisModalJob && (
        <AnalysisModal
          jobId={analysisModalJob.id}
          symbol={analysisModalJob.symbol}
          onClose={() => setAnalysisModalJob(null)}
          onComplete={handleAnalysisCompleted}
        />
      )}
    </div>
  );
};
export default App;
