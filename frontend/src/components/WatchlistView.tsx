// frontend/src/components/WatchlistView.tsx
import React, { useState } from 'react';
import { WatchlistItem } from '../types';
import { TrendingUp, TrendingDown, Trash2, Cpu, Plus, Star } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface WatchlistViewProps {
  watchlist: WatchlistItem[];
  onSelectSymbol: (symbol: string) => void;
  onAnalyzeSymbol: (symbol: string) => void;
  onRefresh: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  onSelectSymbol,
  onAnalyzeSymbol,
  onRefresh,
}) => {
  const { t, translateProvenance } = useLanguage();
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    setAdding(true);
    try {
      await api.addToWatchlist(newSymbol.trim().toUpperCase());
      setNewSymbol('');
      onRefresh();
    } catch (err) {
      alert(`Failed to add: ${err}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeFromWatchlist(symbol);
      onRefresh();
    } catch (err) {
      alert(`Failed to remove: ${err}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} color="var(--color-warning)" fill="var(--color-warning)" />
            {t('watchlist.title', 'Indian Equities Watchlist')} ({watchlist.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {t('watchlist.sub', 'Real-time tracking of top NSE & BSE stocks with verified market quotes.')}
          </p>
        </div>

        {/* Add Stock Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder={t('watchlist.add_placeholder', 'Add ticker (e.g. SBIN.NS)...')}
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              outline: 'none',
              width: '220px',
            }}
          />
          <button type="submit" className="btn-secondary" disabled={adding}>
            <Plus size={14} /> {t('watchlist.add_button', 'Add')}
          </button>
        </form>
      </div>

      <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>{t('watchlist.col_symbol', 'Symbol / Company')}</th>
              <th>{t('watchlist.col_ltp', 'LTP')}</th>
              <th>{t('watchlist.col_change', 'Change')}</th>
              <th>{t('watchlist.col_day_range', 'Day Range')}</th>
              <th>{t('watchlist.col_52w_range', '52W Range')}</th>
              <th>{t('watchlist.col_status', 'Status & Freshness')}</th>
              <th style={{ textAlign: 'right' }}>{t('watchlist.col_actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {t('watchlist.empty', 'No symbols in your watchlist. Add one above to track in real-time.')}
                </td>
              </tr>
            ) : (
              watchlist.map((item) => {
                const isPos = (item.change ?? 0) >= 0;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectSymbol(item.symbol)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.company_name}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      ₹{item.price?.toFixed(2) || 'N/A'}
                    </td>
                    <td
                      style={{
                        color: isPos ? 'var(--color-bullish)' : 'var(--color-bearish)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {item.change ? `${isPos ? '+' : ''}${item.change.toFixed(2)}` : '0.00'}{' '}
                      ({item.change_percent ? `${isPos ? '+' : ''}${item.change_percent.toFixed(2)}%` : '0.00%'})
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      ₹{item.day_low?.toFixed(1) || '—'} - ₹{item.day_high?.toFixed(1) || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      ₹{item.week_52_low?.toFixed(1) || '—'} - ₹{item.week_52_high?.toFixed(1) || '—'}
                    </td>
                    <td>
                      <span className={`pill ${item.status === 'LIVE' ? 'pill-live' : 'pill-historical'}`} style={{ fontSize: '0.66rem' }}>
                        {translateProvenance(item.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnalyzeSymbol(item.symbol);
                          }}
                          title="Run Multi-Agent Research Analysis"
                        >
                          <Cpu size={12} /> {t('watchlist.action_analyze', 'Analyze')}
                        </button>
                        <button
                          onClick={(e) => handleRemove(item.symbol, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Remove from watchlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
