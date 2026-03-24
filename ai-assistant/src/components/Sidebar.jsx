/**
 * Sidebar.jsx — Updated with stage-aware status pill and retry button
 */
import React from 'react';
import {
  MessageSquare, PenLine, FileText, Mic,
  FileSearch, Code2, Shield, Cpu, AlertCircle,
  CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import { ERROR_TYPES } from '../context/RunAnywhereContext';
import './Layout.css';

export const VIEWS = [
  { id: 'chat',    label: 'AI Chat',          icon: MessageSquare, color: '#5b5ef4', bg: 'rgba(91,94,244,0.1)'  },
  { id: 'write',   label: 'Writing Assistant', icon: PenLine,       color: '#7b5cf7', bg: 'rgba(123,92,247,0.1)' },
  { id: 'notes',   label: 'Smart Notes',       icon: FileText,      color: '#06c0de', bg: 'rgba(6,192,222,0.1)'  },
  { id: 'voice',   label: 'Voice Input',       icon: Mic,           color: '#14b87a', bg: 'rgba(20,184,122,0.1)' },
  { id: 'analyze', label: 'Doc Analyzer',      icon: FileSearch,    color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
  { id: 'code',    label: 'Code Explainer',    icon: Code2,         color: '#f24444', bg: 'rgba(242,68,68,0.1)'  },
];

export default function Sidebar({ activeView, setActiveView }) {
  const {
    llmStatus, loadStage, loadProgress,
    errorType, retryCount, canRetry,
    initLLM, retryLLM,
  } = useRunAnywhere();

  const isWebGPUError = errorType === ERROR_TYPES.NO_WEBGPU;

  // Status pill content
  const pillContent = {
    idle:    { dot: 'dot-yellow', label: 'Not loaded',    sub: 'Click ⚡ to load' },
    loading: { dot: 'dot-blue dot-pulse', label: loadStage?.label ?? 'Loading…', sub: `${loadProgress}%` },
    ready:   { dot: 'dot-green', label: 'Ready',          sub: 'Local · Private' },
    error:   { dot: 'dot-red',   label: isWebGPUError ? 'WebGPU N/A' : 'Load failed', sub: canRetry ? 'Click ↻ to retry' : 'Refresh page' },
  }[llmStatus] ?? { dot: 'dot-yellow', label: '—', sub: '' };

  return (
    <nav className="sidebar">
      {/* Logo — Premium Rakshak AI brand mark */}
      <div className="sidebar-logo" style={{ alignItems:'center', gap:13 }}>

        {/* Shield badge with glow ring */}
        <div className="animate-float" style={{
          width:46, height:46, borderRadius:14, flexShrink:0,
          background:'linear-gradient(145deg,#1e3a8a 0%,#2563eb 55%,#06b6d4 100%)',
          boxShadow:'0 6px 20px rgba(37,99,235,0.45), 0 0 0 3px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
          display:'grid', placeItems:'center', position:'relative', overflow:'hidden',
        }}>
          {/* Inner top-light sheen */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:'48%',
            background:'linear-gradient(180deg,rgba(255,255,255,0.22) 0%,transparent 100%)',
            borderRadius:'14px 14px 0 0',
          }} />
          <Shield size={21} color="white" strokeWidth={2.2} style={{ position:'relative', zIndex:1 }} />
        </div>

        {/* Brand text */}
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          {/* "Rakshak AI" — premium gradient + glow */}
          <div style={{
            fontSize:'1.08rem',
            fontWeight:800,
            letterSpacing:'-0.03em',
            lineHeight:1.1,
            /* Gradient text */
            background:'linear-gradient(125deg, #1e3a8a 0%, #2563eb 45%, #0ea5e9 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            /* Glow via filter */
            filter:'drop-shadow(0 0 6px rgba(37,99,235,0.35))',
          }}>
            Rakshak&nbsp;
            <span style={{
              background:'linear-gradient(125deg, #0ea5e9 0%, #06b6d4 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundClip:'text',
            }}>AI</span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize:'0.65rem',
            fontWeight:500,
            letterSpacing:'0.06em',
            color:'#64748b',
            display:'flex', alignItems:'center', gap:4,
          }}>
            <span style={{
              width:5, height:5, borderRadius:'50%',
              background:'linear-gradient(135deg,#2563eb,#06b6d4)',
              display:'inline-block', flexShrink:0,
            }} />
            Your Data's Guardian
          </div>
        </div>
      </div>

      <div className="sidebar-label">Features</div>

      {VIEWS.map(({ id, label, icon: Icon, color }, i) => (
        <div
          key={id}
          className={`nav-item${activeView === id ? ' active' : ''} animate-slide delay-${Math.min(i + 1, 4)}`}
          onClick={() => setActiveView(id)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setActiveView(id)}
          aria-current={activeView === id ? 'page' : undefined}
        >
          <div className="nav-icon">
            <Icon size={17} color={activeView === id ? 'white' : color} />
          </div>
          {label}
          {/* Show "needs model" indicator when model not loaded and view requires it */}
          {llmStatus !== 'ready' && ['chat','write','notes','analyze','code'].includes(id) && (
            <span style={{ marginLeft:'auto', fontSize:'0.6rem', color:'var(--text-4)', fontWeight:600 }}>LLM</span>
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Progress bar during loading */}
        {llmStatus === 'loading' && (
          <div style={{ padding:'0 4px 10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-3)', marginBottom:5 }}>
              <span style={{ maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {loadStage?.label ?? 'Loading…'}
              </span>
              <span style={{ fontWeight:700, color:'var(--primary)', flexShrink:0 }}>{loadProgress}%</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-fill" style={{ width:`${loadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Status pill */}
        <div className="model-pill">
          <span className={`dot ${pillContent.dot}`} />
          <div className="model-info">
            <div className="model-name">Llama 3.2-1B · WebGPU</div>
            <div className="model-sub">{pillContent.label} · {pillContent.sub}</div>
          </div>

          {/* Action button */}
          {llmStatus === 'idle' && (
            <button onClick={initLLM} className="btn btn-primary btn-icon"
              style={{ width:30, height:30, borderRadius:'var(--r-sm)', marginLeft:'auto', flexShrink:0 }}
              title="Load model">
              <Cpu size={13} />
            </button>
          )}
          {llmStatus === 'loading' && (
            <Loader2 size={16} style={{ marginLeft:'auto', color:'var(--primary)', animation:'spin 1s linear infinite', flexShrink:0 }} />
          )}
          {llmStatus === 'ready' && (
            <CheckCircle2 size={16} style={{ marginLeft:'auto', color:'var(--success)', flexShrink:0 }} />
          )}
          {llmStatus === 'error' && !isWebGPUError && canRetry && (
            <button onClick={retryLLM} className="btn btn-danger btn-icon"
              style={{ width:30, height:30, borderRadius:'var(--r-sm)', marginLeft:'auto', flexShrink:0 }}
              title={`Retry (${retryCount}/3)`}>
              <RefreshCw size={13} />
            </button>
          )}
          {llmStatus === 'error' && (isWebGPUError || !canRetry) && (
            <AlertCircle size={16} style={{ marginLeft:'auto', color:'var(--danger)', flexShrink:0 }} />
          )}
        </div>

        {/* Retry count indicator */}
        {llmStatus === 'error' && retryCount > 0 && (
          <div style={{ fontSize:'0.7rem', color:'var(--text-3)', textAlign:'center', padding:'4px 0' }}>
            Attempt {retryCount} / 3
          </div>
        )}
      </div>
    </nav>
  );
}
