// frontend/src/components/HistoryView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { History, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HistoryViewProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (analysis: AnalysisRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ analyses, onSelectAnalysis }) => {
  const { t, translateDirective, isHindi } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--color-accent-cyan)" />
          {t('history.title', 'Research Analysis Archive')} ({analyses.length})
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {t('history.sub', 'Auditable archive of all autonomous multi-agent deliberations and structured research decisions.')}
        </p>
      </div>

      <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>{t('history.col_time', 'Date & Time (IST)')}</th>
              <th>{t('history.col_symbol', 'Symbol & Company')}</th>
              <th>{t('history.col_price', 'Price At Analysis')}</th>
              <th>{t('history.col_signal', 'AI Signal')}</th>
              <th>{t('history.col_evidence', 'Evidence Quality')}</th>
              <th>{t('history.col_model', 'Model / Provider')}</th>
              <th>{t('history.col_duration', 'Duration')}</th>
              <th style={{ textAlign: 'right' }}>{t('history.col_report', 'Report')}</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {t('history.empty', 'No historical analyses recorded yet.')}
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
                        {translateDirective(item.signal)}
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
                        {isHindi ? 'रिपोर्ट देखें' : 'Inspect'} <ArrowRight size={12} />
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
