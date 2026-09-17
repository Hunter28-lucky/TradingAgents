// frontend/src/components/FundamentalsTable.tsx
import React, { useState } from 'react';
import { Fundamentals } from '../types';
import { Layers, ShieldCheck, DollarSign, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FundamentalsTableProps {
  fundamentals: Fundamentals | null;
  loading: boolean;
}

export const FundamentalsTable: React.FC<FundamentalsTableProps> = ({ fundamentals, loading }) => {
  const { t } = useLanguage();
  const [statementTab, setStatementTab] = useState<'income' | 'balance' | 'cashflow'>('income');

  if (loading) {
    return (
      <div className="terminal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Layers size={28} className="spin" color="var(--color-accent-cyan)" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {t('fund.loading', 'Retrieving audited financial statements and ratios...')}
        </div>
      </div>
    );
  }

  if (!fundamentals || !fundamentals.overview) {
    return (
      <div className="terminal-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>{t('fund.unavailable', 'Audited financials unavailable for this symbol.')}</div>
      </div>
    );
  }


  const { overview, key_ratios, income_statement, balance_sheet, cash_flow, provenance } = fundamentals;

  const formatCrores = (val?: number) => {
    if (!val || isNaN(val)) return 'N/A';
    // Format in INR Crores (1 Cr = 10,000,000)
    const cr = val / 10000000;
    return `₹${cr.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Overview & Key Valuation Ratios */}
      <div className="grid-2">
        {/* Company Profile Card */}
        <div className="terminal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {overview.company_name}
            </h3>
            {overview.website && (
              <a
                href={overview.website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
              >
                Website <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <span className="pill pill-historical">{overview.sector || 'Sector N/A'}</span>
            <span className="pill pill-historical">{overview.industry || 'Industry N/A'}</span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '140px', overflowY: 'auto' }}>
            {overview.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('fund.market_cap', 'MARKET CAP')}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCrores(overview.market_cap)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('fund.enterprise_value', 'ENTERPRISE VALUE')}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCrores(overview.enterprise_value)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('fund.currency', 'CURRENCY')}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-cyan)', fontFamily: 'var(--font-mono)' }}>
                {overview.currency || 'INR'}
              </div>
            </div>
          </div>
        </div>

        {/* Valuation & Capital Compounding Ratios */}
        <div className="terminal-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {t('fund.ratios_title', 'Audited Valuation & Profitability Ratios')}
          </h3>
          <table className="terminal-table">
            <tbody>
              <tr>
                <td>P/E (Trailing 12M)</td>
                <td style={{ fontWeight: 700, color: (key_ratios.pe_ratio_trailing ?? 0) > 40 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                  {key_ratios.pe_ratio_trailing ? `${key_ratios.pe_ratio_trailing.toFixed(2)}x` : 'N/A'}
                </td>
                <td>P/B (Price to Book)</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.price_to_book ? `${key_ratios.price_to_book.toFixed(2)}x` : 'N/A'}</td>
              </tr>
              <tr>
                <td>Forward P/E</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.pe_ratio_forward ? `${key_ratios.pe_ratio_forward.toFixed(2)}x` : 'N/A'}</td>
                <td>EV / EBITDA</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.ev_to_ebitda ? `${key_ratios.ev_to_ebitda.toFixed(2)}x` : 'N/A'}</td>
              </tr>
              <tr>
                <td>Return on Equity (ROE)</td>
                <td style={{ fontWeight: 700, color: (key_ratios.return_on_equity_pct ?? 0) > 15 ? 'var(--color-bullish)' : 'var(--text-primary)' }}>
                  {key_ratios.return_on_equity_pct ? `${key_ratios.return_on_equity_pct}%` : 'N/A'}
                </td>
                <td>Return on Assets (ROA)</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.return_on_assets_pct ? `${key_ratios.return_on_assets_pct}%` : 'N/A'}</td>
              </tr>
              <tr>
                <td>Operating Margin</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.operating_margins_pct ? `${key_ratios.operating_margins_pct}%` : 'N/A'}</td>
                <td>Profit Margin</td>
                <td style={{ fontWeight: 600 }}>{key_ratios.profit_margins_pct ? `${key_ratios.profit_margins_pct}%` : 'N/A'}</td>
              </tr>
              <tr>
                <td>Debt to Equity</td>
                <td style={{ fontWeight: 700, color: (key_ratios.debt_to_equity ?? 0) > 100 ? 'var(--color-bearish)' : 'var(--text-primary)' }}>
                  {key_ratios.debt_to_equity ? `${key_ratios.debt_to_equity.toFixed(2)}` : 'N/A'}
                </td>
                <td>Dividend Yield</td>
                <td style={{ fontWeight: 600, color: 'var(--color-bullish)' }}>
                  {key_ratios.dividend_yield_pct ? `${key_ratios.dividend_yield_pct}%` : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Statements Tabs */}
      <div className="terminal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-secondary ${statementTab === 'income' ? 'active' : ''}`}
              onClick={() => setStatementTab('income')}
              style={{ background: statementTab === 'income' ? 'var(--color-accent-blue)' : undefined }}
            >
              {t('fund.tab_income', 'Income Statement')}
            </button>
            <button
              className={`btn-secondary ${statementTab === 'balance' ? 'active' : ''}`}
              onClick={() => setStatementTab('balance')}
              style={{ background: statementTab === 'balance' ? 'var(--color-accent-blue)' : undefined }}
            >
              {t('fund.tab_balance', 'Balance Sheet')}
            </button>
            <button
              className={`btn-secondary ${statementTab === 'cashflow' ? 'active' : ''}`}
              onClick={() => setStatementTab('cashflow')}
              style={{ background: statementTab === 'cashflow' ? 'var(--color-accent-blue)' : undefined }}
            >
              {t('fund.tab_cashflow', 'Cash Flow')}
            </button>
          </div>


          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Values in ₹ Crores (Reported)
          </span>
        </div>

        {statementTab === 'income' && (
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Revenue</th>
                <th>Operating Income</th>
                <th>EBITDA</th>
                <th>Net Income</th>
              </tr>
            </thead>
            <tbody>
              {income_statement.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Income statement data unavailable from provider</td></tr>
              ) : (
                income_statement.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.period}</td>
                    <td>{formatCrores(row.revenue)}</td>
                    <td>{formatCrores(row.operating_income)}</td>
                    <td>{formatCrores(row.ebitda)}</td>
                    <td style={{ fontWeight: 700, color: (row.net_income ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                      {formatCrores(row.net_income)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {statementTab === 'balance' && (
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Total Assets</th>
                <th>Total Liabilities</th>
                <th>Total Debt</th>
                <th>Cash & Equivalents</th>
                <th>Stockholders Equity</th>
              </tr>
            </thead>
            <tbody>
              {balance_sheet.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Balance sheet data unavailable from provider</td></tr>
              ) : (
                balance_sheet.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.period}</td>
                    <td>{formatCrores(row.total_assets)}</td>
                    <td>{formatCrores(row.total_liabilities)}</td>
                    <td>{formatCrores(row.total_debt)}</td>
                    <td>{formatCrores(row.cash_and_equivalents)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCrores(row.stockholders_equity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {statementTab === 'cashflow' && (
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Operating Cash Flow</th>
                <th>Investing Cash Flow</th>
                <th>Financing Cash Flow</th>
                <th>Free Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {cash_flow.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Cash flow data unavailable from provider</td></tr>
              ) : (
                cash_flow.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.period}</td>
                    <td style={{ color: (row.operating_cash_flow ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                      {formatCrores(row.operating_cash_flow)}
                    </td>
                    <td>{formatCrores(row.investing_cash_flow)}</td>
                    <td>{formatCrores(row.financing_cash_flow)}</td>
                    <td style={{ fontWeight: 700, color: (row.free_cash_flow ?? 0) >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                      {formatCrores(row.free_cash_flow)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Provenance Footnote */}
      <div className="data-provenance-bar">
        <span>Source: <strong>{provenance.source}</strong></span>
        <span>Retrieved At: <strong>{provenance.retrieved_at}</strong></span>
        <span>Status: <strong>{provenance.status}</strong></span>
        <span>Standard: <strong>Audited SEBI/MCA Filings</strong></span>
      </div>
    </div>
  );
};
