// frontend/src/components/SentimentView.tsx
import React from 'react';
import { SentimentData } from '../types';
import { MessageSquare, ShieldAlert, CheckCircle, BarChart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SentimentViewProps {
  sentiment: SentimentData | null;
  loading: boolean;
}

export const SentimentView: React.FC<SentimentViewProps> = ({ sentiment, loading }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="terminal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <MessageSquare size={28} className="spin" color="var(--color-accent-cyan)" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {t('sentiment.loading', 'Aggregating and analyzing media tone...')}
        </div>
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="terminal-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>{t('sentiment.unavailable', 'Sentiment data unavailable for this symbol.')}</div>
      </div>
    );
  }

  const isPositive = (sentiment.score ?? 0) > 0.15;
  const isNegative = (sentiment.score ?? 0) < -0.15;
  const badgeColor = isPositive ? 'var(--color-bullish)' : isNegative ? 'var(--color-bearish)' : 'var(--color-accent-cyan)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Summary Card */}
      <div
        className="terminal-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: `4px solid ${badgeColor}`,
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {t('sentiment.title', 'Aggregated Public Sentiment')}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: badgeColor, fontFamily: 'var(--font-display)', marginTop: '2px' }}>
            {sentiment.label}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            Score: <strong>{sentiment.score !== null && sentiment.score !== undefined ? (sentiment.score > 0 ? `+${sentiment.score}` : sentiment.score) : 'N/A'}</strong> (Scale -1.0 to +1.0)
          </div>
        </div>

        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          <div>{t('sentiment.sample_size', 'Sample Size')}: <strong style={{ color: 'var(--text-primary)' }}>{sentiment.sample_size} articles</strong></div>
          <div style={{ marginTop: '4px' }}>{t('sentiment.window', 'Window')}: <strong style={{ color: 'var(--text-cyan)' }}>{sentiment.time_window}</strong></div>
          <div style={{ marginTop: '4px' }}>{t('sentiment.confidence', 'Confidence')}: <strong style={{ color: sentiment.confidence === 'HIGH' ? 'var(--color-bullish)' : 'var(--color-warning)' }}>{sentiment.confidence}</strong></div>
        </div>
      </div>

      {/* Details & Sample Breakdown */}
      <div className="terminal-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {t('sentiment.provenance_title', 'Sample & Source Provenance')}
        </h3>


        {sentiment.sample_size < 3 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)' }}>
            <ShieldAlert size={20} />
            <span>Sample size insufficient to produce statistically reliable sentiment. Marked as Insufficient Data.</span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Publishers and outlets analyzed in this window:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sentiment.sources_inspected.map((src, i) => (
                <span key={i} className="pill pill-historical" style={{ fontSize: '0.72rem' }}>
                  {src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Provenance Footnote */}
      <div className="data-provenance-bar">
        <span>Source: <strong>{sentiment.provenance.source}</strong></span>
        <span>Status: <strong>{sentiment.provenance.status}</strong></span>
        <span>Validation: <strong>{sentiment.provenance.note || 'Calculated from actual press texts'}</strong></span>
      </div>
    </div>
  );
};
