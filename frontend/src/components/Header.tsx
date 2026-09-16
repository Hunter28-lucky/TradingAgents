// frontend/src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react';
import { MarketOverview, Quote } from '../types';
import { api } from '../api/client';

interface HeaderProps {
  overview: MarketOverview | null;
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

export const Header: React.FC<HeaderProps> = ({ overview, onSelectSymbol, selectedSymbol }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 1) {
      setIsSearching(true);
      try {
        const res = await api.searchSymbols(val);
        setSearchResults(res);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (sym: string) => {
    onSelectSymbol(sym);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Ticker Tape */}
      <div className="ticker-tape">
        {overview?.indices.map((idx) => {
          const isPos = (idx.change ?? 0) >= 0;
          return (
            <div
              key={idx.symbol}
              className="ticker-item"
              onClick={() => onSelectSymbol(idx.symbol)}
              title={`Click to analyze ${idx.name}`}
            >
              <span className="name">{idx.name}</span>
              <span className="price">
                {idx.price ? `₹${idx.price.toLocaleString('en-IN')}` : 'N/A'}
              </span>
              <span
                style={{
                  color: isPos ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: 600,
                }}
              >
                {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.change_percent ? `${isPos ? '+' : ''}${idx.change_percent.toFixed(2)}%` : '0.00%'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">TA</div>
          <div>
            <div className="brand-title">TradingAgents</div>
            <div className="brand-sub">Indian Equity Decision Terminal</div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-container" ref={dropdownRef}>
          <div className="search-input-wrapper">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="Search symbol (e.g. RELIANCE, TCS, INFY, NIFTY 50)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((item) => (
                <div
                  key={item.symbol}
                  className="search-result-item"
                  onClick={() => handleSelect(item.symbol)}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.symbol}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="pill pill-historical" style={{ fontSize: '0.65rem' }}>
                      {item.exchange || 'NSE'}
                    </span>
                    {item.sector && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.sector}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Status Pill & Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            className={`pill ${overview?.is_market_open ? 'pill-live' : 'pill-historical'}`}
            title={overview?.session_label}
          >
            {overview?.session_label || 'Indian Market Session'}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={14} color="var(--text-cyan)" />
            <span>{overview?.current_time_ist || 'Asia/Kolkata'}</span>
          </div>
        </div>
      </header>
    </>
  );
};
