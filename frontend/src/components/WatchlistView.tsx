// frontend/src/components/WatchlistView.tsx
import React, { useState } from 'react';
import { WatchlistItem } from '../types';
import { TrendingUp, TrendingDown, Trash2, Cpu, Plus, Star } from 'lucide-react';
import { api } from '../api/client';

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
            Indian Equities Watchlist ({watchlist.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Real-time tracking of top NSE & BSE stocks with verified market quotes.
          </p>
        </div>

        {/* Add Stock Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Add ticker (e.g. SBIN.NS)..."
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
            <Plus size={14} /> Add
          </button>
        </form>
      </div>

      <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Symbol / Company</th>
              <th>LTP</th>
              <th>Change</th>
              <th>Day Range</th>
              <th>52W Range</th>
              <th>Status & Freshness</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No stocks in watchlist. Add a stock using the input above.
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
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.company_name}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'N/A'}
                    </td>
                    <td style={{ color: isPos ? 'var(--color-bullish)' : 'var(--color-bearish)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {item.change_percent ? `${isPos ? '+' : ''}${item.change_percent.toFixed(2)}%` : '0.00%'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      ₹{item.day_low ?? 'N/A'} - ₹{item.day_high ?? 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      ₹{item.week_52_low ?? 'N/A'} - ₹{item.week_52_high ?? 'N/A'}
                    </td>
                    <td>
                      <span className={`pill ${item.status === 'LIVE' ? 'pill-live' : 'pill-historical'}`} style={{ fontSize: '0.66rem' }}>
                        {item.status}
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
                          <Cpu size={12} /> Analyze
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
