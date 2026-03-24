/**
 * WritingView.jsx — Premium Writing Assistant
 */
import React, { useState } from 'react';
import { Mail, AlignLeft, Sparkles, RefreshCw, Copy, Check, Wand2 } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

const ACTIONS = [
  {
    id: 'email', label: 'Write Email', icon: Mail,
    color: '#5b5ef4', bg: 'rgba(91,94,244,0.1)',
    desc: 'Professional from notes',
    placeholder: 'E.g.: team meeting Friday 3pm, Q2 review, confirm attendance',
    buildPrompt: t => `Write a professional, concise email based on these notes:\n${t}\n\nEmail:`,
    system: 'You are an expert business writer. Write clear, professional email.',
  },
  {
    id: 'summarize', label: 'Summarize', icon: AlignLeft,
    color: '#06c0de', bg: 'rgba(6,192,222,0.1)',
    desc: 'TL;DR any text',
    placeholder: 'Paste the text you want summarized here…',
    buildPrompt: t => `Summarize in 3–5 bullet points, be concise:\n\n${t}\n\nSummary:`,
    system: 'You extract key information and produce clear, bullet-point summaries.',
  },
  {
    id: 'improve', label: 'Improve Writing', icon: Wand2,
    color: '#14b87a', bg: 'rgba(20,184,122,0.1)',
    desc: 'Enhance clarity & tone',
    placeholder: 'Paste your draft here…',
    buildPrompt: t => `Rewrite to be clearer, more professional and engaging (keep meaning):\n\n${t}\n\nImproved:`,
    system: 'You are a skilled editor specializing in writing clarity and impact.',
  },
  {
    id: 'blog', label: 'Blog Intro', icon: RefreshCw,
    color: '#f5a623', bg: 'rgba(245,166,35,0.1)',
    desc: 'Compelling opening para',
    placeholder: 'Enter blog topic + key points…',
    buildPrompt: t => `Write a captivating blog intro (2–3 paragraphs) about:\n${t}\n\nBlog Intro:`,
    system: 'You write engaging, curiosity-inspiring blog introductions.',
  },
];

export default function WritingView() {
  const { llmStatus, initLLM, complete } = useRunAnywhere();
  const [selected, setSelected] = useState(ACTIONS[0]);
  const [input, setInput]       = useState('');
  const [output, setOutput]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const run = async () => {
    if (!input.trim()) return;
    if (llmStatus !== 'ready') { initLLM(); return; }
    setLoading(true); setOutput('');
    try {
      setOutput(await complete(selected.buildPrompt(input), selected.system));
    } catch (e) { setOutput(`❌ ${e.message}`); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div className="view-header">
        <h1>✍️ Writing Assistant</h1>
        <p>Generate emails, summaries, and polished content — all offline.</p>
      </div>

      {/* Action cards */}
      <div className="wa-grid">
        {ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={`wa-card animate-fade-up delay-${i + 1}${selected.id === a.id ? ' selected' : ''}`}
              onClick={() => { setSelected(a); setInput(''); setOutput(''); }}
            >
              <div className="icon-chip" style={{ background: a.bg }}>
                <Icon size={22} color={a.color} />
              </div>
              <h3>{a.label}</h3>
              <p>{a.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="card" style={{ padding:24 }}>
        <div className="output-label"><selected.icon size={12} /> Your Input</div>
        <textarea
          rows={5}
          placeholder={selected.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button className="btn btn-primary" onClick={run} disabled={!input.trim() || loading}>
            {loading
              ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' }} /> Generating…</>
              : <><Sparkles size={14} /> Generate</>
            }
          </button>
          <button className="btn btn-ghost" onClick={() => { setInput(''); setOutput(''); }}>Clear</button>
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="card animate-fade-up" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div className="output-label" style={{ margin:0 }}><Sparkles size={12} /> AI Output</div>
            {output && (
              <button className="btn btn-outline" style={{ padding:'7px 14px', fontSize:'0.8rem' }} onClick={copy}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            )}
          </div>
          {loading
            ? (
              <div>
                <div className="thinking-row" style={{ marginBottom:12 }}>
                  <div className="thinking-dots"><div className="thinking-dot"/><div className="thinking-dot"/><div className="thinking-dot"/></div>
                  AI is writing for you…
                </div>
                <div className="shimmer-lines">
                  {[100,80,92,65].map((w,i) => (
                    <div key={i} className="skeleton shimmer-line" style={{ width:`${w}%` }} />
                  ))}
                </div>
              </div>
            )
            : <div className="output-box">{output}</div>
          }
        </div>
      )}
    </div>
  );
}
