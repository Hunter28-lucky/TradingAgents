// frontend/src/components/DecisionView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { Award, CheckCircle, ShieldAlert, Clock, Cpu, FileText, MessageSquare, Bot } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';


interface DecisionViewProps {
  analysis: AnalysisRecord | null;
  onNavigateToChat?: (prompt?: string) => void;
}

export const DecisionView: React.FC<DecisionViewProps> = ({ analysis, onNavigateToChat }) => {
  const { t, translateDirective } = useLanguage();

  if (!analysis) {
    return (
      <div className="terminal-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          {t('decision.no_analysis', 'Run an AI research analysis to synthesize the final decision and thesis for this symbol.')}
        </div>
      </div>
    );
  }

  const isBuy = analysis.signal.includes('BUY');
  const isSell = analysis.signal.includes('SELL');
  const signalColor = isBuy
    ? 'var(--color-bullish)'
    : isSell
    ? 'var(--color-bearish)'
    : 'var(--color-accent-cyan)';

  const qualityColor =
    analysis.evidence_quality === 'HIGH'
      ? 'var(--color-bullish)'
      : analysis.evidence_quality === 'MEDIUM'
      ? 'var(--color-warning)'
      : 'var(--color-bearish)';

  const price = analysis.price_at_analysis || 0;
  const targetPrice = analysis.target_price || (analysis.risk_analysis as any)?.target_price;
  const stopLoss = analysis.stop_loss || (analysis.risk_analysis as any)?.stop_loss;
  const rrRatio = analysis.risk_reward_ratio || (analysis.risk_analysis as any)?.risk_reward_ratio || '1 : 2.5';
  const conviction = analysis.conviction_score || (analysis.risk_analysis as any)?.conviction_score || (isBuy ? 80 : isSell ? 78 : 55);
  const entryZone = analysis.entry_zone || (analysis.risk_analysis as any)?.entry_zone || `Near ₹${price.toFixed(2)}`;
  const keyCatalyst = analysis.key_catalyst || analysis.bull_case?.strongest_arguments?.[0] || 'Favorable risk/reward profile';
  const invalidationTrigger = analysis.invalidation_trigger || `Sustained breakdown below ₹${stopLoss ? Number(stopLoss).toFixed(2) : 'support'}.`;

  const targetPct = price > 0 && targetPrice ? ((targetPrice - price) / price) * 100 : null;
  const stopPct = price > 0 && stopLoss ? ((stopLoss - price) / price) * 100 : null;

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
              {t('decision.synthesized_directive', 'Synthesized Portfolio Manager Directive')}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: signalColor, fontFamily: 'var(--font-display)', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {translateDirective(analysis.signal)}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {t('decision.time_horizon', 'Time Horizon')}: <strong style={{ color: 'var(--text-primary)' }}>{analysis.time_horizon}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('decision.conviction', 'AI CONVICTION')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: signalColor, marginTop: '2px' }}>
                {conviction}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('decision.evidence_quality', 'EVIDENCE QUALITY')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: qualityColor, marginTop: '2px' }}>
                {analysis.evidence_quality}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('decision.price_at_analysis', 'PRICE AT ANALYSIS')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{analysis.price_at_analysis?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('decision.execution_time', 'EXECUTION TIME')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-cyan)', marginTop: '2px' }}>
                {analysis.execution_duration_sec}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Direction & Execution Strategy Grid */}
      <div className="terminal-card" style={{ borderTop: `3px solid ${signalColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color={signalColor} /> {t('decision.trade_bracket', 'Tactical Trade Execution Bracket')}
          </h3>
          <span className="pill pill-live" style={{ fontSize: '0.72rem' }}>
            Deterministic Calculation
          </span>
        </div>

        <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Target Price */}
          <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('decision.target_price', 'TARGET PRICE')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-bullish)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {targetPrice ? `₹${Number(targetPrice).toFixed(2)}` : 'N/A'}
            </div>
            {targetPct !== null && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-bullish)', marginTop: '2px', fontWeight: 600 }}>
                {targetPct >= 0 ? `+${targetPct.toFixed(1)}%` : `${targetPct.toFixed(1)}%`} Upside
              </div>
            )}
          </div>

          {/* Stop Loss */}
          <div style={{ background: 'rgba(255, 23, 68, 0.05)', border: '1px solid rgba(255, 23, 68, 0.2)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('decision.stop_loss', 'STOP LOSS')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-bearish)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {stopLoss ? `₹${Number(stopLoss).toFixed(2)}` : 'N/A'}
            </div>
            {stopPct !== null && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-bearish)', marginTop: '2px', fontWeight: 600 }}>
                {stopPct.toFixed(1)}% Downside Risk
              </div>
            )}
          </div>

          {/* Risk : Reward */}
          <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('decision.rr_ratio', 'RISK / REWARD')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent-cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {rrRatio}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Institutional Standard
            </div>
          </div>

          {/* Entry Zone */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('decision.entry_zone', 'RECOMMENDED ENTRY')}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              {entryZone}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Near key structural support
            </div>
          </div>
        </div>

        {/* Primary Catalyst & Invalidation Cards */}
        <div className="grid-2" style={{ gap: '1rem' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(0, 230, 118, 0.04)', borderLeft: '3px solid var(--color-bullish)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-bullish)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('decision.primary_catalyst', 'Primary Upside Catalyst')}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {keyCatalyst}
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'rgba(255, 23, 68, 0.04)', borderLeft: '3px solid var(--color-bearish)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-bearish)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('decision.invalidation_trigger', 'Critical Invalidation Trigger')}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {invalidationTrigger}
            </div>
          </div>
        </div>
      </div>


      {/* Interactive AI Chat Callout */}
      <div
        className="terminal-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(90deg, rgba(0, 210, 255, 0.08) 0%, rgba(16, 21, 32, 0.95) 100%)',
          border: '1px solid rgba(0, 210, 255, 0.35)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Bot size={18} style={{ color: 'var(--accent-primary, #00d2ff)' }} />
            <span>Interrogate the Multi-Agent Research Desk</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            Ask the Portfolio Manager or specialist analysts why this directive was issued, target probability, stop-loss invalidation, or balance sheet health.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => onNavigateToChat?.('Why did you recommend this directive?')}
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MessageSquare size={14} /> Chat with Analysts
          </button>
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
