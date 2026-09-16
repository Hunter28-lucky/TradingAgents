// frontend/src/api/client.ts
import {
  AnalysisRecord,
  DataSourceItem,
  EvaluationRecord,
  Fundamentals,
  MarketOverview,
  OHLCVResponse,
  Quote,
  SentimentData,
  TechnicalIndicators,
  WatchlistItem,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && err.detail) {
        errorDetail = err.detail;
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getMarketOverview(): Promise<MarketOverview> {
    const res = await fetch(`${API_BASE}/market/overview`);
    return handleResponse<MarketOverview>(res);
  },

  async getMarketClock(): Promise<any> {
    const res = await fetch(`${API_BASE}/market/clock`);
    return handleResponse<any>(res);
  },

  async searchSymbols(q: string): Promise<Array<{ symbol: string; name: string; exchange: string; sector?: string; type: string }>> {
    const res = await fetch(`${API_BASE}/market/search?q=${encodeURIComponent(q)}`);
    const data = await handleResponse<{ results: any[] }>(res);
    return data.results || [];
  },

  async getStockOverview(symbol: string): Promise<Quote> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/overview`);
    return handleResponse<Quote>(res);
  },

  async getStockOHLCV(symbol: string, period = '1y', interval = '1d'): Promise<OHLCVResponse> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/ohlcv?period=${period}&interval=${interval}`);
    return handleResponse<OHLCVResponse>(res);
  },

  async getStockTechnicals(symbol: string): Promise<TechnicalIndicators> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/technicals`);
    return handleResponse<TechnicalIndicators>(res);
  },

  async getStockFundamentals(symbol: string): Promise<Fundamentals> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/fundamentals`);
    return handleResponse<Fundamentals>(res);
  },

  async getStockNews(symbol: string, limit = 15): Promise<any[]> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/news?limit=${limit}`);
    const data = await handleResponse<{ articles: any[] }>(res);
    return data.articles || [];
  },

  async getStockSentiment(symbol: string): Promise<SentimentData> {
    const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}/sentiment`);
    return handleResponse<SentimentData>(res);
  },

  async startAnalysis(symbol: string, provider?: string, model?: string): Promise<{ job_id: string; symbol: string }> {
    const res = await fetch(`${API_BASE}/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, provider, model }),
    });
    return handleResponse<{ job_id: string; symbol: string }>(res);
  },

  async getAnalysisHistory(symbol?: string): Promise<AnalysisRecord[]> {
    const url = symbol ? `${API_BASE}/analysis/history?symbol=${encodeURIComponent(symbol)}` : `${API_BASE}/analysis/history`;
    const res = await fetch(url);
    const data = await handleResponse<{ analyses: AnalysisRecord[] }>(res);
    return data.analyses || [];
  },

  async getAnalysisDetail(id: string): Promise<AnalysisRecord> {
    const res = await fetch(`${API_BASE}/analysis/${encodeURIComponent(id)}`);
    return handleResponse<AnalysisRecord>(res);
  },

  async getEvaluations(): Promise<EvaluationRecord[]> {
    const res = await fetch(`${API_BASE}/evaluations`);
    const data = await handleResponse<{ evaluations: EvaluationRecord[] }>(res);
    return data.evaluations || [];
  },

  async refreshEvaluations(): Promise<any> {
    const res = await fetch(`${API_BASE}/evaluations/refresh`, { method: 'POST' });
    return handleResponse<any>(res);
  },

  async getWatchlist(): Promise<WatchlistItem[]> {
    const res = await fetch(`${API_BASE}/watchlist`);
    const data = await handleResponse<{ watchlist: WatchlistItem[] }>(res);
    return data.watchlist || [];
  },

  async addToWatchlist(symbol: string, company_name?: string, sector?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, company_name, sector }),
    });
    return handleResponse<any>(res);
  },

  async removeFromWatchlist(symbol: string): Promise<any> {
    const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
    return handleResponse<any>(res);
  },

  async getDataSources(): Promise<DataSourceItem[]> {
    const res = await fetch(`${API_BASE}/system/providers`);
    const data = await handleResponse<{ sources: DataSourceItem[] }>(res);
    return data.sources || [];
  },

  async getAvailableModels(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/system/models`);
    const data = await handleResponse<{ models: any[] }>(res);
    return data.models || [];
  },
};
