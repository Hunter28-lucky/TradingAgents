// frontend/src/components/TechnicalsTable.tsx
import React from 'react';
import { TechnicalIndicators } from '../types';
import { Activity, ShieldAlert, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface TechnicalsTableProps {
  technicals: TechnicalIndicators | null;
  loading: boolean;
}

export const TechnicalsTable: React.FC<TechnicalsTableProps> = ({ technicals, loading }) => {
  if (loading) {
    return (
      <div className="terminal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Activity size={28} className="spin" color="var(--color-accent-cyan)" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Computing deterministic indicators from OHLCV...
        </div>
      </div>
    );
  }

  if (!technicals || !technicals.indicators) {
    return (
      <div className="terminal-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={24} color="var(--color-warning)" />
        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Technical indicators unavailable for this symbol.
        </div>
      </div>
    );
  }

  const ind = technicals.indicators;
  const biasColor =
    technicals.overall_bias === 'BULLISH'
      ? 'var(--color-bullish)'
      : technicals.overall_bias === 'BEARISH'
      ? 'var(--color-bearish)'
      : 'var(--color-accent-cyan)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Bias Banner */}
      <div
        className="terminal-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: `4px solid ${biasColor}`,
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Deterministic Technical Bias
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: biasColor, fontFamily: 'var(--font-display)', marginTop: '2px' }}>
            {technicals.overall_bias}
          </div>
        </div>

        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>Data Range: <strong style={{ color: 'var(--text-primary)' }}>{technicals.data_range}</strong></div>
          <div style={{ marginTop: '2px' }}>Method: <strong style={{ color: 'var(--text-cyan)' }}>Zero-Hallucination Code Execution</strong></div>
        </div>
      </div>

      {/* Grid: Momentum, Trend, Volatility, Levels */}
      <div className="grid-2">
        {/* Momentum & Oscillators */}
        <div className="terminal-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Momentum & Oscillators
          </h3>
          <table className="terminal-table">
            <tbody>
              <tr>
                <td>RSI (14-period Wilder)</td>
                <td style={{ fontWeight: 700, color: (ind.rsi_14 ?? 50) > 70 ? 'var(--color-bearish)' : (ind.rsi_14 ?? 50) < 30 ? 'var(--color-bullish)' : 'var(--text-primary)' }}>
                  {ind.rsi_14 ?? 'N/A'}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {technicals.interpretations.rsi || 'Neutral zone'}
                </td>
              </tr>
              <tr>
                <td>MACD Line (12, 26)</td>
                <td style={{ fontWeight: 600 }}>{ind.macd?.macd_line ?? 'N/A'}</td>
                <td rowSpan={2} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                  {technicals.interpretations.macd || 'Trend momentum'}
                </td>
              </tr>
              <tr>
                <td>Signal Line (9 EMA)</td>
                <td style={{ fontWeight: 600 }}>{ind.macd?.signal_line ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>MACD Histogram</td>
                <td style={{ fontWeight: 700, color: (ind.macd?.histogram ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                  {ind.macd?.histogram ? `${ind.macd.histogram > 0 ? '+' : ''}${ind.macd.histogram}` : 'N/A'}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(ind.macd?.histogram ?? 0) >= 0 ? 'Expanding upside momentum' : 'Expanding downside momentum'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Moving Averages */}
        <div className="terminal-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Moving Averages Structure
          </h3>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>SMA</th>
                <th>EMA</th>
                <th>Price vs MA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Short (9 / 20)</td>
                <td>₹{ind.sma_20 ?? 'N/A'}</td>
                <td>₹{ind.ema_9 ?? 'N/A'}</td>
                <td style={{ color: (ind.last_close ?? 0) > (ind.sma_20 ?? 0) ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                  {(ind.last_close ?? 0) > (ind.sma_20 ?? 0) ? 'Above 20 SMA' : 'Below 20 SMA'}
                </td>
              </tr>
              <tr>
                <td>Medium (21 / 50)</td>
                <td>₹{ind.sma_50 ?? 'N/A'}</td>
                <td>₹{ind.ema_21 ?? 'N/A'}</td>
                <td style={{ color: (ind.last_close ?? 0) > (ind.sma_50 ?? 0) ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                  {(ind.last_close ?? 0) > (ind.sma_50 ?? 0) ? 'Above 50 SMA' : 'Below 50 SMA'}
                </td>
              </tr>
              <tr>
                <td>Long (100 / 200)</td>
                <td>₹{ind.sma_200 ?? 'N/A'}</td>
                <td>₹{ind.ema_200 ?? 'N/A'}</td>
                <td style={{ fontWeight: 700, color: (ind.last_close ?? 0) > (ind.sma_200 ?? 0) ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                  {(ind.last_close ?? 0) > (ind.sma_200 ?? 0) ? 'Bullish (> 200 SMA)' : 'Bearish (< 200 SMA)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Volatility, Bollinger, and Support/Resistance */}
      <div className="grid-2">
        {/* Volatility & Bollinger Bands */}
        <div className="terminal-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Volatility & Bands
          </h3>
          <table className="terminal-table">
            <tbody>
              <tr>
                <td>Average True Range (ATR 14)</td>
                <td style={{ fontWeight: 600 }}>₹{ind.atr_14 ?? 'N/A'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily range expectation</td>
              </tr>
              <tr>
                <td>Historical Volatility (30d Ann.)</td>
                <td style={{ fontWeight: 600 }}>{ind.volatility_30d_annualized ? `${ind.volatility_30d_annualized}%` : 'N/A'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annualized standard deviation</td>
              </tr>
              <tr>
                <td>Bollinger Upper (2σ)</td>
                <td style={{ fontWeight: 600, color: 'var(--color-bearish)' }}>₹{ind.bollinger_bands?.upper ?? 'N/A'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upper resistance band</td>
              </tr>
              <tr>
                <td>Bollinger Lower (2σ)</td>
                <td style={{ fontWeight: 600, color: 'var(--color-bullish)' }}>₹{ind.bollinger_bands?.lower ?? 'N/A'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lower support band</td>
              </tr>
              <tr>
                <td>Relative Volume (RVOL)</td>
                <td style={{ fontWeight: 700 }}>{ind.rvol ? `${ind.rvol}x` : 'N/A'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{technicals.interpretations.volume || 'Volume participation'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pivot Points */}
        <div className="terminal-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Support & Resistance (Pivot Levels)
          </h3>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Classic Pivot</th>
                <th>Fibonacci Pivot</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--color-bearish)', fontWeight: 600 }}>Resistance 2 (R2)</td>
                <td>₹{ind.pivot_points_classic?.r2 ?? 'N/A'}</td>
                <td>₹{ind.pivot_points_fibonacci?.r2 ?? 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-bearish)', fontWeight: 600 }}>Resistance 1 (R1)</td>
                <td>₹{ind.pivot_points_classic?.r1 ?? 'N/A'}</td>
                <td>₹{ind.pivot_points_fibonacci?.r1 ?? 'N/A'}</td>
              </tr>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                <td style={{ color: 'var(--color-accent-cyan)', fontWeight: 700 }}>Pivot Point (PP)</td>
                <td style={{ fontWeight: 700 }}>₹{ind.pivot_points_classic?.pivot ?? 'N/A'}</td>
                <td style={{ fontWeight: 700 }}>₹{ind.pivot_points_fibonacci?.pivot ?? 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-bullish)', fontWeight: 600 }}>Support 1 (S1)</td>
                <td>₹{ind.pivot_points_classic?.s1 ?? 'N/A'}</td>
                <td>₹{ind.pivot_points_fibonacci?.s1 ?? 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-bullish)', fontWeight: 600 }}>Support 2 (S2)</td>
                <td>₹{ind.pivot_points_classic?.s2 ?? 'N/A'}</td>
                <td>₹{ind.pivot_points_fibonacci?.s2 ?? 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance Footnote */}
      <div className="data-provenance-bar">
        <span>Source: <strong>{technicals.provenance.source}</strong></span>
        <span>Calculated At: <strong>{technicals.provenance.retrieved_at}</strong></span>
        <span>Status: <strong>{technicals.provenance.status}</strong></span>
        <span>Validation: <strong>{technicals.provenance.note}</strong></span>
      </div>
    </div>
  );
};
