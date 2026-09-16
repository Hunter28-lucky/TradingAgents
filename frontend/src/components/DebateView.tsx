// frontend/src/components/DebateView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react';

interface DebateViewProps {
  analysis: AnalysisRecord | null;
}

export const DebateView: React.FC<DebateViewProps> = ({ analysis }) => {
  if (!analysis || !analysis.bull_case || !analysis.bear_case) {
    return (
      <div className="terminal-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          Run an AI research analysis to generate the multi-agent Bull vs Bear debate for this symbol.
        </div>
      </div>
    );
  }

  const { bull_case, bear_case } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Structured Multi-Agent Debate Synthesis
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Autonomous deliberation between Bull Researcher and Bear Researcher. No forced consensus.
          </p>
        </div>
        <span className="pill pill-historical" style={{ fontSize: '0.72rem' }}>
          Model: {analysis.model_name}
        </span>
      </div>

      <div className="grid-2">
        {/* Bull Case Card */}
        <div
          className="terminal-card"
          style={{
            borderTop: '3px solid var(--color-bullish)',
            background: 'linear-gradient(180deg, rgba(0, 230, 118, 0.04) 0%, rgba(18, 24, 36, 0.9) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="var(--color-bullish)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-bullish)' }}>
              THE BULL CASE
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Strongest Bullish Arguments
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bull_case.strongest_arguments?.map((arg, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-bullish)', fontWeight: 700 }}>•</span>
                    {arg}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Supporting Evidence
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bull_case.supporting_evidence?.map((ev, i) => (
                  <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <CheckCircle2 size={14} color="var(--color-bullish)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Key Upside Catalysts
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {bull_case.catalysts?.map((cat, i) => (
                  <span key={i} className="pill pill-live" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {bull_case.assumptions && bull_case.assumptions.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Critical Assumptions
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {bull_case.assumptions.join(' • ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bear Case Card */}
        <div
          className="terminal-card"
          style={{
            borderTop: '3px solid var(--color-bearish)',
            background: 'linear-gradient(180deg, rgba(255, 51, 102, 0.04) 0%, rgba(18, 24, 36, 0.9) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <TrendingDown size={20} color="var(--color-bearish)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-bearish)' }}>
              THE BEAR CASE
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Strongest Bearish Arguments
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bear_case.strongest_arguments?.map((arg, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-bearish)', fontWeight: 700 }}>•</span>
                    {arg}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Supporting Evidence & Headwinds
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bear_case.supporting_evidence?.map((ev, i) => (
                  <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <AlertTriangle size={14} color="var(--color-bearish)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                Downside Vulnerabilities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {bear_case.key_risks?.map((risk, i) => (
                  <span key={i} className="pill pill-error" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                    {risk}
                  </span>
                ))}
              </div>
            </div>

            {bear_case.invalidation_conditions && bear_case.invalidation_conditions.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Thesis Invalidation Conditions
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {bear_case.invalidation_conditions.join(' • ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
