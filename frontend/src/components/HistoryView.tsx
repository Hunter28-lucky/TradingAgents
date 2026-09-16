// frontend/src/components/HistoryView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { History, ArrowRight, Clock, Cpu } from 'lucide-react';

interface HistoryViewProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (analysis: AnalysisRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ analyses, onSelectAnalysis }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--color-accent-cyan)" />
          Research Analysis Archive ({analyses.length})
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Auditable archive of all autonomous multi-agent deliberations and structured research decisions.
        </p>
      </div>

      <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Date & Time (IST)</th>
              <th>Symbol & Company</th>
              <th>Price At Analysis</th>
              <th>AI Signal</th>
              <th>Evidence Quality</th>
              <th>Model / Provider</th>
              <th>Duration</th>
              <th style={{ textAlign: 'right' }}>Report</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No historical analyses recorded yet.
                </td>
              </tr>
            ) : (
              analyses.map((item) => {
                const signalColor =
                  item.signal === 'BUY BIAS'
                    ? 'var(--color-bullish)'
                    : item.signal === 'SELL BIAS'
                    ? 'var(--color-bearish)'
                    : 'var(--color-accent-cyan)';

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAnalysis(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontSize: '0.78rem' }}>{item.created_at_ist}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.company_name}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{item.price_at_analysis?.toFixed(2) || 'N/A'}
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          background: `${signalColor}15`,
                          color: signalColor,
                          borderColor: `${signalColor}40`,
                          fontSize: '0.7rem',
                        }}
                      >
                        {item.signal}
                      </span>
                    </td>
                    <td>
                      <span className="pill pill-historical" style={{ fontSize: '0.68rem' }}>
                        {item.evidence_quality}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {item.model_name}
                    </td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {item.execution_duration_sec}s
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnalysis(item);
                        }}
                      >
                        Inspect <ArrowRight size={12} />
                      </button>
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
