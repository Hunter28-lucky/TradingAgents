// frontend/src/types/index.ts

export type DataStatus = 'LIVE' | 'DELAYED' | 'HISTORICAL' | 'STALE' | 'UNAVAILABLE' | 'ERROR';

export type MarketSession = 'PRE_OPEN' | 'PRE_OPEN_BUFFER' | 'OPEN' | 'CLOSING_CALCULATION' | 'POST_CLOSE' | 'CLOSED';

export interface DataProvenance {
  source: string;
  source_timestamp?: string | null;
  retrieved_at: string;
  timezone: string;
  status: DataStatus;
  freshness_label: string;
  latency_ms?: number | null;
  note?: string | null;
}

export interface Quote {
  symbol: string;
  company_name?: string | null;
  exchange: string;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  open?: number | null;
  day_high?: number | null;
  day_low?: number | null;
  previous_close?: number | null;
  volume?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  dividend_yield?: number | null;
  sector?: string | null;
  industry?: string | null;
  provenance: DataProvenance;
}

export interface MarketOverviewIndex {
  name: string;
  symbol: string;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  day_high?: number | null;
  day_low?: number | null;
  provenance: DataProvenance;
}

export interface MarketOverview {
  indices: MarketOverviewIndex[];
  market_session: MarketSession;
  is_market_open: boolean;
  session_label: string;
  current_time_ist: string;
  next_session_change_ist: string;
  provenance: DataProvenance;
}

export interface OHLCVBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVResponse {
  symbol: string;
  period: string;
  interval: string;
  bars_count: number;
  bars: OHLCVBar[];
  provenance: DataProvenance;
}

export interface TechnicalIndicators {
  symbol: string;
  data_range: string;
  indicators: {
    last_close?: number;
    rsi_14?: number;
    sma_20?: number;
    sma_50?: number;
    sma_100?: number;
    sma_200?: number;
    ema_9?: number;
    ema_21?: number;
    ema_50?: number;
    ema_200?: number;
    macd?: {
      macd_line: number;
      signal_line: number;
      histogram: number;
    };
    bollinger_bands?: {
      upper?: number;
      middle?: number;
      lower?: number;
      bandwidth_pct?: number;
      percent_b?: number;
    };
    atr_14?: number;
    volume_20_avg?: number;
    rvol?: number;
    volatility_30d_annualized?: number;
    pivot_points_classic?: {
      pivot: number;
      r1: number;
      r2: number;
      s1: number;
      s2: number;
    };
    pivot_points_fibonacci?: {
      pivot: number;
      r1: number;
      r2: number;
      s1: number;
      s2: number;
    };
  };
  interpretations: Record<string, string>;
  overall_bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  provenance: DataProvenance;
}

export interface Fundamentals {
  symbol: string;
  overview: {
    company_name?: string;
    sector?: string;
    industry?: string;
    currency?: string;
    market_cap?: number;
    enterprise_value?: number;
    employees?: number;
    description?: string;
    website?: string;
  };
  income_statement: Array<{
    period: string;
    revenue?: number;
    operating_income?: number;
    ebitda?: number;
    net_income?: number;
  }>;
  balance_sheet: Array<{
    period: string;
    total_assets?: number;
    total_liabilities?: number;
    total_debt?: number;
    cash_and_equivalents?: number;
    stockholders_equity?: number;
  }>;
  cash_flow: Array<{
    period: string;
    operating_cash_flow?: number;
    investing_cash_flow?: number;
    financing_cash_flow?: number;
    free_cash_flow?: number;
  }>;
  key_ratios: {
    pe_ratio_trailing?: number;
    pe_ratio_forward?: number;
    peg_ratio?: number;
    price_to_book?: number;
    ev_to_ebitda?: number;
    ev_to_revenue?: number;
    return_on_equity_pct?: number;
    return_on_assets_pct?: number;
    profit_margins_pct?: number;
    operating_margins_pct?: number;
    debt_to_equity?: number;
    current_ratio?: number;
    trailing_eps?: number;
    dividend_yield_pct?: number;
    beta?: number;
  };
  provenance: DataProvenance;
}

export interface NewsArticle {
  title: string;
  publisher: string;
  published_at: string;
  url: string;
  summary?: string;
  relevance?: string;
  provenance: DataProvenance;
}

export interface SentimentData {
  symbol: string;
  score?: number | null;
  label: string;
  sample_size: number;
  time_window: string;
  sources_inspected: string[];
  confidence: string;
  provenance: DataProvenance;
}

export interface AnalysisRecord {
  id: string;
  symbol: string;
  company_name?: string;
  created_at: string;
  created_at_ist: string;
  price_at_analysis?: number;
  model_provider: string;
  model_name: string;
  signal: 'STRONG BUY' | 'BUY BIAS' | 'HOLD / NEUTRAL' | 'HOLD BIAS' | 'SELL BIAS' | 'STRONG SELL' | string;
  evidence_quality: 'HIGH' | 'MEDIUM' | 'LOW';
  time_horizon: string;
  conviction_score?: number;
  target_price?: number;
  stop_loss?: number;
  risk_reward_ratio?: string;
  entry_zone?: string;
  key_catalyst?: string;
  invalidation_trigger?: string;
  executive_summary: string;
  investment_thesis: string;
  bull_case: {
    strongest_arguments: string[];
    supporting_evidence: string[];
    catalysts: string[];
    assumptions: string[];
  };
  bear_case: {
    strongest_arguments: string[];
    supporting_evidence: string[];
    key_risks: string[];
    invalidation_conditions: string[];
  };
  risk_analysis: {
    volatility_risk: string;
    volatility_metric: string;
    liquidity_risk: string;
    beta_to_market: number;
    support_level_1?: number;
    support_level_2?: number;
    resistance_level_1?: number;
    stop_loss_guidance: string;
    downside_scenario: string;
  };
  technical_summary: Record<string, any>;
  fundamental_summary: Record<string, any>;
  news_summary: NewsArticle[];
  sentiment_summary: SentimentData;
  sources_metadata: Record<string, DataProvenance>;
  execution_duration_sec: number;
  tokens_used: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message?: string | null;
}

export interface EvaluationRecord {
  id: string;
  analysis_id: string;
  symbol: string;
  signal: string;
  price_at_analysis: number;
  price_1d?: number;
  return_1d_pct?: number;
  price_5d?: number;
  return_5d_pct?: number;
  price_20d?: number;
  return_20d_pct?: number;
  benchmark_symbol: string;
  benchmark_price_at_analysis?: number;
  benchmark_price_20d?: number;
  benchmark_return_20d_pct?: number;
  alpha_20d_pct?: number;
  last_evaluated_at?: string;
  created_at_ist?: string;
  model_name?: string;
  is_settled: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  notes?: string;
  price?: number;
  change?: number;
  change_percent?: number;
  day_high?: number;
  day_low?: number;
  week_52_high?: number;
  week_52_low?: number;
  status: DataStatus;
  freshness: string;
}

export interface DataSourceItem {
  provider: string;
  category: string;
  purpose: string;
  status: 'CONNECTED' | 'UNAVAILABLE' | 'ERROR';
  is_configured: boolean;
  data_type: string;
  last_request: string;
  latency_ms?: number;
  auth_type: string;
  status_message?: string;
}

export type AnalystPersonaKey =
  | 'portfolio_manager'
  | 'technical'
  | 'fundamental'
  | 'risk'
  | 'bull'
  | 'bear';

export interface PersonaInfo {
  title: string;
  badge: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  persona_title?: string;
  persona_badge?: string;
  timestamp_ist?: string;
  sources_consulted?: string[];
}

export interface ChatRequest {
  symbol: string;
  persona?: string;
  analysis_id?: string;
  messages: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  symbol: string;
  persona: string;
  persona_title: string;
  persona_badge: string;
  reply: string;
  sources_consulted: string[];
  timestamp_ist: string;
}

