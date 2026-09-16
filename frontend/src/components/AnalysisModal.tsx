// frontend/src/components/AnalysisModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, Circle, AlertCircle, X, ArrowRight, Clock } from 'lucide-react';

interface AnalysisModalProps {
  jobId: string;
  symbol: string;
  onClose: () => void;
  onComplete: (analysisId: string) => void;
}

const STEPS = [
  'Market Data Retrieval',
  'OHLCV Time Series',
  'Technical Analysis Engine',
  'Fundamental Financials',
  'News Aggregator',
  'Sentiment Analysis',
  'Technical Analyst Node',
  'Fundamentals Analyst Node',
  'News Analyst Node',
  'Sentiment Analyst Node',
  'Bull Researcher',
  'Bear Researcher',
  'Debate & Trader Synthesis',
  'Risk Management',
  'Portfolio Manager Decision',
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ jobId, symbol, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepTitle, setStepTitle] = useState<string>('Initializing multi-agent pipeline...');
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('RUNNING');
  const [resultId, setResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/analysis/${jobId}/stream`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.current_step) setCurrentStep(data.current_step);
        if (data.step_title) setStepTitle(data.step_title);
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (data.status) setStatus(data.status);
        if (data.result_id) setResultId(data.result_id);
        if (data.error) setErrorMsg(data.error);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          es.close();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      // Stream ended or connection closed
      es.close();
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} color="var(--color-accent-cyan)" />
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
              Autonomous Multi-Agent Deliberation: {symbol}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Clock size={14} /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
            </div>
            {status !== 'RUNNING' && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Steps & Streaming Logs */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, minHeight: '380px', overflow: 'hidden' }}>
          {/* Left: 15-Step Progress List */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '1rem', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.2)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
              Execution Stages ({currentStep}/15)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STEPS.map((stepName, i) => {
                const stepNum = i + 1;
                const isDone = stepNum < currentStep || status === 'COMPLETED';
                const isCurrent = stepNum === currentStep && status === 'RUNNING';

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      color: isDone ? 'var(--color-bullish)' : isCurrent ? 'var(--color-accent-cyan)' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} color="var(--color-bullish)" />
                    ) : isCurrent ? (
                      <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent-cyan)', animation: 'pulse-dot 1.2s infinite' }} />
                      </div>
                    ) : (
                      <Circle size={14} color="var(--text-muted)" />
                    )}
                    <span>{stepName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Terminal Log Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', overflow: 'hidden', background: '#090c13' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-cyan)', marginBottom: '0.5rem', fontWeight: 600 }}>
              &gt; LIVE REASONING LOG
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {msg}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {errorMsg && (
              <div style={{ marginTop: '0.75rem', padding: '8px 12px', background: 'var(--color-bearish-bg)', border: '1px solid var(--color-bearish-border)', color: 'var(--color-bearish)', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Status: <strong style={{ color: status === 'COMPLETED' ? 'var(--color-bullish)' : status === 'FAILED' ? 'var(--color-bearish)' : 'var(--color-accent-cyan)' }}>{status}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {status === 'COMPLETED' ? (
              <button
                className="btn-primary"
                onClick={() => {
                  if (resultId) onComplete(resultId);
                  onClose();
                }}
              >
                Inspect Research Report <ArrowRight size={14} />
              </button>
            ) : status === 'FAILED' ? (
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            ) : (
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Processing multi-agent graph nodes...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
