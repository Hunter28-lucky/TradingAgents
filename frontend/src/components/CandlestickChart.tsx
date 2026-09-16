// frontend/src/components/CandlestickChart.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { OHLCVBar, DataProvenance } from '../types';
import { api } from '../api/client';
import { RefreshCw } from 'lucide-react';

interface CandlestickChartProps {
  symbol: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [period, setPeriod] = useState<string>('1y');
  const [loading, setLoading] = useState<boolean>(true);
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);
  const [barsCount, setBarsCount] = useState<number>(0);

  const fetchBars = async (p: string) => {
    setLoading(true);
    try {
      const data = await api.getStockOHLCV(symbol, p, '1d');
      setProvenance(data.provenance);
      setBarsCount(data.bars_count);

      if (seriesRef.current && volumeSeriesRef.current && data.bars.length > 0) {
        // Format for Lightweight Charts: time format 'YYYY-MM-DD'
        const candleData: CandlestickData[] = data.bars.map((b: OHLCVBar) => ({
          time: b.time as any,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }));

        const volumeData = data.bars.map((b: OHLCVBar) => ({
          time: b.time as any,
          value: b.volume,
          color: b.close >= b.open ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 51, 102, 0.4)',
        }));

        seriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);
        chartRef.current?.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Failed to load chart bars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0d111a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: '#00f0ff', width: 1, style: 2 },
        horzLine: { color: '#00f0ff', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25, // Leaves bottom 25% for volume
        },
      },
      autoSize: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff3366',
      borderUpColor: '#00e676',
      borderDownColor: '#ff3366',
      wickUpColor: '#00e676',
      wickDownColor: '#ff3366',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay on same chart with scaleMargins
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    fetchBars(period);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchBars(newPeriod);
  };

  return (
    <div className="terminal-card" style={{ padding: '1rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Price Action & Volume (Daily)
          </span>
          <span className="pill pill-historical" style={{ fontSize: '0.68rem' }}>
            {barsCount} Bars Verified
          </span>
          {loading && <RefreshCw size={14} className="spin" color="var(--text-cyan)" />}
        </div>

        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '2px', borderRadius: '6px' }}>
          {['1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                background: period === p ? 'var(--color-accent-blue)' : 'transparent',
                color: period === p ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '420px', position: 'relative', borderRadius: '6px', overflow: 'hidden' }}
      />

      {/* Provenance Footnote */}
      {provenance && (
        <div className="data-provenance-bar">
          <span>Source: <strong>{provenance.source}</strong></span>
          <span>Status: <strong>{provenance.status}</strong> ({provenance.freshness_label})</span>
          <span>Timezone: <strong>{provenance.timezone}</strong></span>
          <span>Note: <strong>{provenance.note || 'Actual OHLCV Bars'}</strong></span>
        </div>
      )}
    </div>
  );
};
