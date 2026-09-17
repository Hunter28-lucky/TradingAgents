// frontend/src/components/RiskView.tsx
import React from 'react';
import { AnalysisRecord } from '../types';
import { ShieldAlert, ShieldCheck, AlertOctagon, TrendingDown, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RiskViewProps {
  analysis: AnalysisRecord | null;
}

export const RiskView: React.FC<RiskViewProps> = ({ analysis }) => {
  const { t } = useLanguage();

  if (!analysis || !analysis.risk_analysis) {
    return (
      <div className="terminal-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          {t('risk.no_analysis', 'Run an AI research analysis to inspect the multi-agent risk assessment for this symbol.')}
        </div>
      </div>
    );
  }

  const { risk_analysis } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('risk.title', 'Institutional Risk Evaluation')}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {t('risk.sub', 'Stress testing across market volatility, structural liquidity, and key pivot defenses.')}
          </p>
        </div>
      </div>

      <div className="grid-3">
        <div className="terminal-card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('risk.volatility_title', 'Volatility Assessment')}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: risk_analysis.volatility_risk === 'High' ? 'var(--color-bearish)' : 'var(--color-bullish)', marginTop: '4px' }}>
            {risk_analysis.volatility_risk} Volatility
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            Metric: {risk_analysis.volatility_metric}
          </div>
        </div>

        <div className="terminal-card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('risk.liquidity_title', 'Liquidity Profile')}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-accent-cyan)', marginTop: '4px' }}>
            {risk_analysis.liquidity_risk}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            Market Impact: Low Slippage Expected
          </div>
        </div>

        <div className="terminal-card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('risk.beta_title', 'Benchmark Beta')}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {risk_analysis.beta_to_market ? risk_analysis.beta_to_market.toFixed(2) : '1.00'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {t('risk.beta_sub', 'Relative to NIFTY 50 Index')}
          </div>
        </div>
      </div>

      {/* Critical Defense Levels & Stop-Loss */}
      <div className="terminal-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {t('risk.defense_levels', 'Critical Price Defense Levels & Downside Boundary')}
        </h3>

        <div className="grid-2">
          <div>
            <table className="terminal-table">
              <tbody>
                <tr>
                  <td>Primary Support Defense (S1)</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-bullish)' }}>
                    ₹{risk_analysis.support_level_1 ?? 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>Secondary Support Floor (S2)</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-bullish)' }}>
                    ₹{risk_analysis.support_level_2 ?? 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>Overhead Resistance (R1)</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-bearish)' }}>
                    ₹{risk_analysis.resistance_level_1 ?? 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td>Structural Stop-Loss Anchor</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                    {risk_analysis.stop_loss_guidance}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.88rem' }}>
              <AlertOctagon size={16} /> Downside Stress-Test Scenario
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
              {risk_analysis.downside_scenario}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
