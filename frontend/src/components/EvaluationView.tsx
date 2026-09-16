// frontend/src/components/EvaluationView.tsx
import React, { useState } from 'react';
import { EvaluationRecord } from '../types';
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface EvaluationViewProps {
  evaluations: EvaluationRecord[];
  onRefresh: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ evaluations, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.refreshEvaluations();
      onRefresh();
    } catch (err) {
      alert(`Refresh error: ${err}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--color-accent-cyan)" />
            AI Decision Tracking & Research Evaluation
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Empirical validation: Comparing what the AI said vs what actually happened in the market.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          Refresh Historical Outcomes
        </button>
      </div>

      <div style={{ padding: '10px 14px', background: 'rgba(0, 240, 255, 0.06)', border: '1px solid var(--border-highlight)', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-cyan)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
          <ShieldCheck size={14} /> Paper Evaluation Engine
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          This evaluation system tracks post-analysis price trajectory against real verified market prints.
          It does not execute broker trades or manage real capital. Zero historical results are altered.
        </p>
      </div>

      <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Symbol & Model</th>
              <th>AI Signal</th>
              <th>Price At Analysis</th>
              <th>1-Day Return</th>
              <th>5-Day Return</th>
              <th>20-Day Return</th>
              <th>Benchmark (NIFTY 50)</th>
              <th>Alpha</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No historical analyses recorded yet. Run a research analysis on any Indian stock to initiate decision tracking.
                </td>
              </tr>
            ) : (
              evaluations.map((ev) => {
                const signalColor =
                  ev.signal === 'BUY BIAS'
                    ? 'var(--color-bullish)'
                    : ev.signal === 'SELL BIAS'
                    ? 'var(--color-bearish)'
                    : 'var(--color-accent-cyan)';

                const r1Pos = (ev.return_1d_pct ?? 0) >= 0;
                const r5Pos = (ev.return_5d_pct ?? 0) >= 0;

                return (
                  <tr key={ev.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ev.created_at_ist || 'Recent'} • {ev.model_name || 'AI'}
                      </div>
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          background: `${signalColor}15`,
                          color: signalColor,
                          borderColor: `${signalColor}40`,
                        }}
                      >
                        {ev.signal}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{ev.price_at_analysis.toFixed(2)}
                    </td>
                    <td style={{ color: r1Pos ? 'var(--color-bullish)' : 'var(--color-bearish)', fontWeight: 600 }}>
                      {ev.return_1d_pct !== undefined && ev.return_1d_pct !== null ? (
                        <span>{r1Pos ? '+' : ''}{ev.return_1d_pct.toFixed(2)}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ color: r5Pos ? 'var(--color-bullish)' : 'var(--color-bearish)', fontWeight: 600 }}>
                      {ev.return_5d_pct !== undefined && ev.return_5d_pct !== null ? (
                        <span>{r5Pos ? '+' : ''}{ev.return_5d_pct.toFixed(2)}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      {ev.return_20d_pct !== undefined && ev.return_20d_pct !== null ? (
                        <span style={{ fontWeight: 700, color: (ev.return_20d_pct ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                          {(ev.return_20d_pct ?? 0) >= 0 ? '+' : ''}{ev.return_20d_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Tracking (in progress)</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {ev.benchmark_symbol}
                    </td>
                    <td>
                      {ev.alpha_20d_pct !== undefined && ev.alpha_20d_pct !== null ? (
                        <span style={{ fontWeight: 700, color: (ev.alpha_20d_pct ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                          {(ev.alpha_20d_pct ?? 0) >= 0 ? '+' : ''}{ev.alpha_20d_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
