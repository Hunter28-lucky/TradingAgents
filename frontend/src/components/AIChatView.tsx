// frontend/src/components/AIChatView.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  AnalysisRecord,
  ChatMessage,
  Quote,
  TechnicalIndicators,
  Fundamentals,
  NewsArticle,
  SentimentData,
  AnalystPersonaKey,
} from '../types';
import { api } from '../api/client';
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  FileText,
  ShieldAlert,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface AIChatViewProps {
  symbol: string;
  quote: Quote | null;
  activeAnalysis: AnalysisRecord | null;
  technicals?: TechnicalIndicators | null;
  fundamentals?: Fundamentals | null;
  news?: NewsArticle[];
  sentiment?: SentimentData | null;
  initialPrompt?: string;
}

interface PersonaConfig {
  key: AnalystPersonaKey;
  label: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
}

const PERSONAS: PersonaConfig[] = [
  {
    key: 'portfolio_manager',
    label: 'Portfolio Manager',
    badge: 'Decision Synthesizer',
    desc: 'Overall directive, conviction, targets, and capital allocation',
    icon: <Bot size={15} />,
  },
  {
    key: 'technical',
    label: 'Technical Analyst',
    badge: 'Chart & Momentum',
    desc: 'RSI, MACD, EMAs/SMAs, pivots, ATR volatility, and entry zones',
    icon: <TrendingUp size={15} />,
  },
  {
    key: 'fundamental',
    label: 'Fundamental Analyst',
    badge: 'Valuation & Balance Sheet',
    desc: 'P/E ratios, PEG, ROE, margins, debt, and quarterly filings in ₹ Cr',
    icon: <FileText size={15} />,
  },
  {
    key: 'risk',
    label: 'Risk Officer',
    badge: 'Downside & Invalidation',
    desc: 'Stop-loss discipline, drawdown limits, beta, and invalidation criteria',
    icon: <ShieldAlert size={15} />,
  },
  {
    key: 'bull',
    label: 'Bull Researcher',
    badge: 'Upside Thesis',
    desc: 'Growth drivers, margin expansion tailwinds, and breakout odds',
    icon: <BarChart2 size={15} />,
  },
  {
    key: 'bear',
    label: 'Bear Researcher',
    badge: 'Downside Skeptic',
    desc: 'Overhead resistance, multiple de-rating risks, and macroeconomic hurdles',
    icon: <ShieldCheck size={15} />,
  },
];

const PERSONA_SUGGESTED_QUESTIONS: Record<AnalystPersonaKey, { text: string; tag: string }[]> = {
  portfolio_manager: [
    { text: 'Why did you recommend this directive and conviction level?', tag: 'Strategy' },
    { text: 'What are the exact odds and timeline of hitting target price?', tag: 'Target Odds' },
    { text: 'How should I size this position and allocate capital?', tag: 'Allocation' },
    { text: 'Can I enter at current price or wait for the entry zone?', tag: 'Execution' },
    { text: 'How do technicals and fundamentals balance out in this decision?', tag: 'Synthesis' },
  ],
  technical: [
    { text: 'Explain the technical RSI and moving average setup.', tag: 'Oscillators' },
    { text: 'What are the classical and Camarilla pivot support/resistance levels?', tag: 'Levels' },
    { text: 'How are the 20, 50, and 200-day moving averages aligned?', tag: 'Trend' },
    { text: 'What does the MACD histogram say about momentum velocity?', tag: 'MACD' },
    { text: 'What is the daily ATR volatility and recommended entry bracket?', tag: 'Volatility' },
  ],
  fundamental: [
    { text: 'Break down the trailing P/E, forward P/E, and PEG valuation.', tag: 'Valuation' },
    { text: 'How healthy is the balance sheet and debt-to-equity ratio?', tag: 'Solvency' },
    { text: 'What are the Return on Equity (ROE) and capital efficiency?', tag: 'Returns' },
    { text: 'What is the primary corporate catalyst driving earnings growth?', tag: 'Catalyst' },
    { text: 'Is the stock undervalued or overvalued relative to its sector?', tag: 'Multiples' },
  ],
  risk: [
    { text: 'Why is the stop-loss set at this level and what triggers invalidation?', tag: 'Stop Loss' },
    { text: 'What is the maximum drawdown risk and 30-day volatility?', tag: 'Drawdown' },
    { text: 'What happens if there is a gap-down or black swan event?', tag: 'Stress Test' },
    { text: 'Explain the mathematical risk-to-reward ratio for this trade.', tag: 'R:R Ratio' },
    { text: 'What specific daily price close would void this setup?', tag: 'Invalidation' },
  ],
  bull: [
    { text: 'What are the strongest upside catalysts and growth drivers?', tag: 'Growth Thesis' },
    { text: 'What triggers a high-volume breakout toward the target?', tag: 'Breakout' },
    { text: 'Why should an aggressive investor accumulate on dips?', tag: 'Accumulation' },
    { text: 'How do sector tailwinds support operating margin expansion?', tag: 'Tailwinds' },
    { text: 'What could surprise the market positively in coming quarters?', tag: 'Upside' },
  ],
  bear: [
    { text: 'What are the biggest downside threats and valuation risks?', tag: 'Downside' },
    { text: 'Where is the heaviest overhead supply and institutional seller traps?', tag: 'Resistance' },
    { text: 'What could trigger a breakdown below primary support S1?', tag: 'Breakdown' },
    { text: 'Why should a conservative trader stay on the sidelines or sell?', tag: 'Defense' },
    { text: 'Are the current valuation multiples pricing in too much optimism?', tag: 'Froth' },
  ],
};

export const AIChatView: React.FC<AIChatViewProps> = ({
  symbol,
  quote,
  activeAnalysis,
  initialPrompt,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<AnalystPersonaKey>('portfolio_manager');
  const [inputQuery, setInputQuery] = useState<string>(initialPrompt || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSelectPersona = (key: AnalystPersonaKey) => {
    setSelectedPersona(key);
    const pObj = PERSONAS.find((p) => p.key === key);
    if (!pObj) return;

    const currentPrice = quote?.price ? `₹${quote.price.toLocaleString('en-IN')}` : 'Market LTP';
    const directive = activeAnalysis?.signal || 'ACTIVE';

    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'assistant',
        persona_title: pObj.label,
        persona_badge: pObj.badge,
        content: `**${pObj.label} online on ${symbol}.** (Current LTP: **${currentPrice}** | Directive: **${directive}**)\n\n*Specialization: ${pObj.desc}.*\n\nAsk me any specific question about this stock below, or click any of the specialized prompt chips.`,
        sources_consulted: [
          `Verified Real-Time Tick Feed (${quote?.exchange || 'NSE'})`,
          `Specialist AI Research Engine`,
          `Audited Financial Filings`,
        ],
        timestamp_ist: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      },
    ]);
  };

  // Initialize introductory message when symbol changes or tab mounts
  useEffect(() => {
    const currentPrice = quote?.price ? `₹${quote.price.toLocaleString('en-IN')}` : 'Market LTP';
    const directive = activeAnalysis?.signal || 'RESEARCH ACTIVE';
    const target = activeAnalysis?.target_price ? `₹${activeAnalysis.target_price}` : 'Under Calculation';
    const stopLoss = activeAnalysis?.stop_loss ? `₹${activeAnalysis.stop_loss}` : 'Under Calculation';

    setMessages([
      {
        id: 'init-1',
        role: 'assistant',
        persona_title: 'Lead Portfolio Manager',
        persona_badge: 'Decision Synthesizer',
        content: `Welcome to the Institutional AI Analyst Room for **${symbol}**.\n\n` +
          `• **Current Price:** ${currentPrice} | **Active Directive:** **${directive}**\n` +
          `• **Target Price:** **${target}** | **Stop Loss:** **${stopLoss}**\n\n` +
          `I am your Lead Portfolio Manager. You can interrogate my team about why this decision was reached, target probabilities, stop-loss invalidation triggers, technical chart patterns, or balance sheet health. Select any specialist persona above or type your question below.`,
        sources_consulted: [
          `Verified Real-Time Tick Feed (${quote?.exchange || 'NSE'})`,
          `Historical OHLCV Indicators`,
          `Audited Financial Filings`,
          `Multi-Agent Research Synthesis`,
        ],
        timestamp_ist: 'Live Terminal Session',
      },
    ]);
  }, [symbol, quote?.price, activeAnalysis?.signal]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp_ist: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      historyPayload.push({ role: 'user', content: query });

      const res = await api.sendChatMessage({
        symbol,
        persona: selectedPersona,
        analysis_id: activeAnalysis?.id,
        messages: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        persona_title: res.persona_title,
        persona_badge: res.persona_badge,
        content: res.reply,
        sources_consulted: res.sources_consulted,
        timestamp_ist: res.timestamp_ist,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        persona_title: 'System Dispatcher',
        persona_badge: 'Offline Fallback',
        content: `⚠️ Failed to receive response: ${err instanceof Error ? err.message : String(err)}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const currentPersona = PERSONAS.find((p) => p.key === selectedPersona) || PERSONAS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Context Summary Strip */}
      <div
        className="terminal-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(90deg, #101522 0%, #0d121c 100%)',
          borderLeft: '4px solid var(--accent-primary, #00d2ff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ACTIVE SYMBOL</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {symbol} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({quote?.exchange || 'NSE'})</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAST TRADED PRICE</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {quote?.price ? `₹${quote.price.toLocaleString('en-IN')}` : 'Loading...'}
            </div>
          </div>
          {activeAnalysis && (
            <>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DIRECTIVE</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-bullish)', fontFamily: 'var(--font-mono)' }}>
                  {activeAnalysis.signal}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONVICTION</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {activeAnalysis.conviction_score ? `${activeAnalysis.conviction_score}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TARGET</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-bullish)', fontFamily: 'var(--font-mono)' }}>
                  {activeAnalysis.target_price ? `₹${activeAnalysis.target_price}` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>STOP LOSS</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-bearish)', fontFamily: 'var(--font-mono)' }}>
                  {activeAnalysis.stop_loss ? `₹${activeAnalysis.stop_loss}` : 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleClearChat}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Reset conversation"
        >
          <RotateCcw size={13} /> Reset Chat
        </button>
      </div>

      {/* Persona Selector Bar */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} /> SELECT SPECIALIST ANALYST PERSONA TO INTERROGATE:
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
          }}
        >
          {PERSONAS.map((p) => {
            const isSelected = selectedPersona === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handleSelectPersona(p.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  background: isSelected ? 'rgba(0, 210, 255, 0.12)' : 'var(--card-bg, #101520)',
                  border: isSelected ? '1px solid var(--accent-primary, #00d2ff)' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ color: isSelected ? 'var(--accent-primary, #00d2ff)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {p.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    }}
                  >
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={12} style={{ color: 'var(--color-bullish)' }} /> {currentPersona.label.toUpperCase()} PROMPTS (CLICK TO ASK):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(PERSONA_SUGGESTED_QUESTIONS[selectedPersona] || PERSONA_SUGGESTED_QUESTIONS.portfolio_manager).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.text)}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '5px 12px',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary, #00d2ff)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span style={{ color: 'var(--accent-primary, #00d2ff)', fontWeight: 600 }}>•</span>
              {q.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        className="terminal-card"
        style={{
          minHeight: '420px',
          maxHeight: '560px',
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#090d14',
          border: '1px solid var(--border-color)',
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              {/* Message Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                {isUser ? (
                  <>
                    <span>You (Trader)</span>
                    <User size={12} />
                  </>
                ) : (
                  <>
                    <Bot size={12} style={{ color: 'var(--accent-primary, #00d2ff)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.persona_title || currentPersona.label}
                    </span>
                    {m.persona_badge && (
                      <span
                        className="pill pill-historical"
                        style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                      >
                        {m.persona_badge}
                      </span>
                    )}
                    {m.timestamp_ist && <span>• {m.timestamp_ist}</span>}
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: isUser ? '80%' : '90%',
                  padding: '1rem 1.25rem',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isUser
                    ? 'linear-gradient(135deg, #18283e 0%, #152033 100%)'
                    : '#111723',
                  border: isUser
                    ? '1px solid rgba(0, 210, 255, 0.3)'
                    : '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  lineHeight: '1.55',
                  fontFamily: isUser ? 'var(--font-sans)' : 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </div>

              {/* Sources Consulted Tag */}
              {!isUser && m.sources_consulted && m.sources_consulted.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '6px',
                    maxWidth: '90%',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={11} style={{ color: 'var(--color-bullish)' }} /> Real Data Sources:
                  </span>
                  {m.sources_consulted.map((s, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <Bot size={14} className="spin-animation" style={{ color: 'var(--accent-primary, #00d2ff)' }} />
            <span>{currentPersona.label} is analyzing verified tick & financial context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'var(--card-bg, #101520)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ color: 'var(--accent-primary, #00d2ff)', display: 'flex', alignItems: 'center' }}>
          {currentPersona.icon}
        </div>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${currentPersona.label} about ${symbol} (e.g., target chances, stop loss, why buy, technical RSI)...`}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)',
          }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputQuery.trim()}
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading || !inputQuery.trim() ? 0.6 : 1,
          }}
        >
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
};
