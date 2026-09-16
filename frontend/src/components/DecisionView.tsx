// frontend/src/components/DecisionView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { Award, CheckCircle, ShieldAlert, Clock, Cpu, FileText } from 'lucide-react';

interface DecisionViewProps {
  analysis: AnalysisRecord | null;
}

export const DecisionView: React.FC<DecisionViewProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="terminal-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          Run an AI research analysis to synthesize the final decision and thesis for this symbol.
        </div>
      </div>
    );
  }

  const signalColor =
    analysis.signal === 'BUY BIAS'
      ? 'var(--color-bullish)'
      : analysis.signal === 'SELL BIAS'
      ? 'var(--color-bearish)'
      : 'var(--color-accent-cyan)';

  const qualityColor =
    analysis.evidence_quality === 'HIGH'
      ? 'var(--color-bullish)'
      : analysis.evidence_quality === 'MEDIUM'
      ? 'var(--color-warning)'
      : 'var(--color-bearish)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        className="terminal-card"
        style={{
          borderLeft: `6px solid ${signalColor}`,
          background: 'linear-gradient(135deg, rgba(18, 24, 36, 0.95) 0%, rgba(13, 17, 26, 0.95) 100%)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Synthesized Portfolio Manager Decision
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: signalColor, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {analysis.signal}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Time Horizon: <strong style={{ color: 'var(--text-primary)' }}>{analysis.time_horizon}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EVIDENCE QUALITY</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: qualityColor, marginTop: '2px' }}>
                {analysis.evidence_quality}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PRICE AT ANALYSIS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{analysis.price_at_analysis?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EXECUTION TIME</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-cyan)', marginTop: '2px' }}>
                {analysis.execution_duration_sec}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary & Thesis */}
      <div className="terminal-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--color-accent-cyan)" /> Executive Summary
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {analysis.executive_summary}
        </p>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--color-bullish)" /> Core Investment Thesis
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {analysis.investment_thesis}
        </p>
      </div>

      {/* Execution Audit & Model Details */}
      <div className="terminal-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Research Provenance & Model Audit
        </h3>
        <div className="grid-4">
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LLM BACKBONE</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {analysis.model_name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PROVIDER</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px', textTransform: 'capitalize' }}>
              {analysis.model_provider}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TIMESTAMP (IST)</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {analysis.created_at_ist}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOKENS AUDITED</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {analysis.tokens_used.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '10px 14px', background: 'rgba(255, 171, 0, 0.08)', border: '1px solid rgba(255, 171, 0, 0.25)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>
            <ShieldAlert size={14} /> Decision Support Disclaimer
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px' }}>
            This synthesized signal is an AI research decision-support artifact produced by multi-agent deliberation over retrieved data.
            It does not constitute financial advice or guaranteed market direction. The platform enforces zero live order execution.
          </p>
        </div>
      </div>
    </div>
  );
};
