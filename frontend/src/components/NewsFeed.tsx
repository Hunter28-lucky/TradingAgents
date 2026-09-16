// frontend/src/components/NewsFeed.tsx
import React from 'react';
import { NewsArticle } from '../types';
import { Newspaper, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';

interface NewsFeedProps {
  articles: NewsArticle[];
  loading: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ articles, loading }) => {
  if (loading) {
    return (
      <div className="terminal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Newspaper size={28} className="spin" color="var(--color-accent-cyan)" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Aggregating verified press articles...
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="terminal-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>No recent verified news articles found for this symbol.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Verified Financial Press ({articles.length} Articles)
        </div>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-cyan)' }}>
          Rule: Real Sources Only — No Fabricated Articles
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {articles.map((art, idx) => (
          <div
            key={idx}
            className="terminal-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '1rem',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <a
                href={art.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  lineHeight: 1.4,
                }}
                className="hover-cyan"
              >
                {art.title}
              </a>
              {art.url && (
                <a
                  href={art.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  title="Open source article"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {art.summary && (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>
                {art.summary}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-cyan)', fontWeight: 600 }}>{art.publisher}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {art.published_at}
              </span>
              <span>•</span>
              <span style={{ color: 'var(--color-bullish)', textTransform: 'uppercase' }}>
                Source Verified ✓
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
