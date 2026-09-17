// frontend/src/components/DataSourcesView.tsx
import React from 'react';
import { DataSourceItem } from '../types';
import { Database, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DataSourcesViewProps {
  sources: DataSourceItem[];
  loading: boolean;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ sources }) => {
  const { t, isHindi } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--color-accent-cyan)" />
          {t('sources.title', 'Data Sources & Infrastructure Transparency')}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {t('sources.sub', 'Real-time health, latency, and configuration audit for all market data and LLM intelligence providers.')}
        </p>
      </div>

      <div className="grid-3">
        {sources.map((src, i) => {
          const isConnected = src.status === 'CONNECTED';
          return (
            <div
              key={i}
              className="terminal-card"
              style={{
                borderLeft: `3px solid ${isConnected ? 'var(--color-bullish)' : 'var(--border-medium)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {src.provider}
                </span>
                <span className={`pill ${isConnected ? 'pill-live' : 'pill-historical'}`} style={{ fontSize: '0.68rem' }}>
                  {isHindi ? (isConnected ? 'सक्रिय (CONNECTED)' : 'ऑफ़लाइन (OFFLINE)') : src.status}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-cyan)', fontFamily: 'var(--font-mono)' }}>
                {src.category}
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {src.purpose}
              </p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'डेटा प्रकार:' : 'Data Type:'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{src.data_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'प्रमाणीकरण:' : 'Auth / Keys:'}</span>
                  <span style={{ color: src.is_configured ? 'var(--color-bullish)' : 'var(--color-warning)' }}>
                    {src.status_message || (src.is_configured ? (isHindi ? 'कॉन्फ़िगर किया गया ✓' : 'Configured ✓') : (isHindi ? 'कॉन्फ़िगर नहीं है' : 'Not configured'))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'विलंबता (Latency):' : 'Latency:'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {src.latency_ms ? `${src.latency_ms} ms` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'अंतिम पिंग:' : 'Last Ping:'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{src.last_request}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="terminal-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--color-bullish)" /> {t('sources.security_title', 'Security & Secret Isolation Policy')}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('sources.security_desc', 'All broker API secrets (Upstox, Zerodha) and LLM credentials (Anthropic, Google, OpenAI) are strictly isolated on the backend server in environment configuration. No credentials or raw tokens are ever transmitted across client endpoints or included in browser bundles.')}
        </p>
      </div>
    </div>
  );
};
