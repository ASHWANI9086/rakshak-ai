/**
 * ModelLoader.jsx — Stage-aware loading overlay with smart error recovery
 */
import React from 'react';
import {
  AlertCircle, RefreshCw, Shield, Zap,
  WifiOff, Cpu, MemoryStick, KeyRound, HelpCircle
} from 'lucide-react';
import { useRunAnywhere, ERROR_TYPES } from '../context/RunAnywhereContext';
import './Layout.css';

// Per-error-type configuration
const ERROR_CONFIG = {
  [ERROR_TYPES.NO_WEBGPU]: {
    Icon: Cpu,
    color: 'var(--primary)',
    title: 'WebGPU Not Supported',
    cta: null,          // Can't retry — needs browser change
    link: { label: 'How to enable WebGPU →', url: 'https://caniuse.com/webgpu' },
  },
  [ERROR_TYPES.OOM]: {
    Icon: MemoryStick,
    color: 'var(--warning)',
    title: 'Out of Memory',
    cta: 'Retry',
    link: null,
  },
  [ERROR_TYPES.NETWORK]: {
    Icon: WifiOff,
    color: 'var(--danger)',
    title: 'Network Error',
    cta: 'Retry Download',
    link: null,
  },
  [ERROR_TYPES.API_KEY]: {
    Icon: KeyRound,
    color: 'var(--warning)',
    title: 'Invalid API Key',
    cta: null,
    link: { label: 'Get your key →', url: 'https://runanywhere.io/dashboard' },
  },
  [ERROR_TYPES.GENERIC]: {
    Icon: HelpCircle,
    color: 'var(--danger)',
    title: 'Load Failed',
    cta: 'Retry',
    link: null,
  },
};

export default function ModelLoader() {
  const {
    llmStatus, loadStage, loadProgress,
    errorType, errorMsg,
    retryCount, canRetry,
    isCached, initLLM, retryLLM,
  } = useRunAnywhere();

  if (llmStatus === 'idle' || llmStatus === 'ready') return null;

  // ── Error state ────────────────────────────────────────────────────────────
  if (llmStatus === 'error') {
    const cfg = ERROR_CONFIG[errorType] ?? ERROR_CONFIG[ERROR_TYPES.GENERIC];
    const { Icon, color, title, cta, link } = cfg;
    const lines = (errorMsg ?? '').split('\n');

    return (
      <div className="model-overlay">
        <div className="card model-overlay-box animate-scale">
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--r-xl)',
            background: `${color}18`,
            display: 'grid', placeItems: 'center',
          }}>
            <Icon size={30} color={color} strokeWidth={1.8} />
          </div>

          <h2>{title}</h2>

          {/* Error details — first line bold, rest as body */}
          <div style={{ width:'100%', background:'var(--surface-2)', borderRadius:'var(--r-md)', padding:'14px 16px', border:'1px solid var(--border)', textAlign:'left' }}>
            {lines.map((line, i) => (
              <p key={i} style={{
                fontSize: i === 0 ? '0.88rem' : '0.82rem',
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? 'var(--text-1)' : 'var(--text-2)',
                marginTop: i > 0 ? 6 : 0,
                lineHeight: 1.6,
              }}>
                {line}
              </p>
            ))}
          </div>

          {/* Retry attempt info */}
          {retryCount > 0 && (
            <p style={{ fontSize:'0.76rem', color:'var(--text-3)' }}>
              Attempt {retryCount} / 3
            </p>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            {cta && canRetry && (
              <button className="btn btn-primary" onClick={retryLLM}>
                <RefreshCw size={14} /> {cta}
              </button>
            )}
            {cta && !canRetry && (
              <p style={{ fontSize:'0.8rem', color:'var(--danger)', fontWeight:600 }}>
                Max retries reached. Please refresh the page.
              </p>
            )}
            {link && (
              <a
                href={link.url} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline"
              >
                {link.label}
              </a>
            )}
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
            <span className="badge badge-glass"><Shield size={10} /> No data sent to servers</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  const stageLabel = loadStage?.label ?? 'Initializing…';

  return (
    <div className="model-overlay">
      <div className="card model-overlay-box animate-scale">
        {/* Dual-ring spinner */}
        <div style={{ width:64, height:64, position:'relative', display:'grid', placeItems:'center' }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'3.5px solid transparent', borderTopColor:'var(--primary)',
            animation:'spin 0.85s linear infinite'
          }} />
          <div style={{
            position:'absolute', inset:9, borderRadius:'50%',
            border:'3px solid transparent', borderTopColor:'var(--accent)',
            animation:'spin 1.3s linear infinite reverse'
          }} />
          <div style={{
            width:20, height:20, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--primary), var(--accent))',
            boxShadow:'0 0 14px var(--primary-glow)',
          }} />
        </div>

        <div style={{ textAlign:'center' }}>
          <h2 style={{ marginBottom:8 }}>Loading AI Model</h2>
          {/* Stage label with thinking dots */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--text-2)', fontSize:'0.86rem' }}>
            <span>{stageLabel}</span>
            <div className="thinking-dots" style={{ display:'flex', gap:3 }}>
              <div className="thinking-dot" style={{ width:5, height:5 }} />
              <div className="thinking-dot" style={{ width:5, height:5 }} />
              <div className="thinking-dot" style={{ width:5, height:5 }} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width:'100%', maxWidth:310 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--text-3)', marginBottom:6 }}>
            <span>{isCached ? '⚡ Loading from cache' : '📦 First-time download (~500MB)'}</span>
            <span style={{ fontWeight:700, color:'var(--primary)' }}>{loadProgress}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width:`${loadProgress}%` }} />
          </div>
        </div>

        {/* Stage pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
          {['Checking', 'Fetching', 'Compiling', 'Warming', 'Ready'].map((s, i) => {
            const stages = ['checking', 'fetching', 'compiling', 'warming', 'ready'];
            const curr   = loadStage?.id;
            const currIdx = stages.indexOf(curr);
            const done    = i < currIdx;
            const active  = i === currIdx;
            return (
              <span key={s} style={{
                fontSize:'0.7rem', fontWeight:600,
                padding:'3px 10px', borderRadius:'99px',
                background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface-3)',
                color: (done || active) ? 'white' : 'var(--text-4)',
                transition:'all 0.3s ease',
              }}>
                {done ? '✓ ' : ''}{s}
              </span>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          <span className="badge badge-glass"><Shield size={10} /> Zero data leaves device</span>
          <span className="badge badge-glass"><Zap size={10} /> WebGPU accelerated</span>
        </div>
      </div>
    </div>
  );
}
