/**
 * AnalyzeView.jsx — STEP 6b: Document Analyzer
 * Paste any document, ask questions or request analysis.
 */
import React, { useState } from 'react';
import { FileSearch, Sparkles, HelpCircle, Tag, ScrollText } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

const MODES = [
  {
    id: 'summary', label: 'Full Summary', icon: ScrollText,
    prompt: (doc, q) => `Provide a comprehensive summary of this document:\n\n${doc}\n\nSummary:`,
    system: 'You are an expert document analyst. Provide clear, structured summaries.',
  },
  {
    id: 'qa', label: 'Ask a Question', icon: HelpCircle,
    prompt: (doc, q) => `Based on this document:\n\n${doc}\n\nAnswer this question: ${q}\n\nAnswer:`,
    system: 'You answer questions accurately based only on the provided document.',
    hasQuestion: true,
  },
  {
    id: 'topics', label: 'Extract Topics', icon: Tag,
    prompt: (doc) => `Extract and list the main topics, themes, and entities from this document:\n\n${doc}\n\nTopics:`,
    system: 'You identify and categorize topics and themes from documents.',
  },
];

export default function AnalyzeView() {
  const { llmStatus, initLLM, complete } = useRunAnywhere();
  const [doc, setDoc]           = useState('');
  const [question, setQuestion] = useState('');
  const [mode, setMode]         = useState(MODES[0]);
  const [output, setOutput]     = useState('');
  const [loading, setLoading]   = useState(false);

  const analyze = async () => {
    if (!doc.trim()) return;
    if (mode.hasQuestion && !question.trim()) return;
    if (llmStatus !== 'ready') { initLLM(); return; }
    setLoading(true); setOutput('');
    try {
      const result = await complete(mode.prompt(doc, question), mode.system);
      setOutput(result);
    } catch (err) { setOutput(`❌ ${err.message}`); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="view-header animate-fade">
        <h1>🔍 Document Analyzer</h1>
        <p>Paste any document, email, or article — then summarize, question, or extract topics.</p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              className={`btn ${mode.id === m.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              onClick={() => { setMode(m); setOutput(''); }}
            >
              <Icon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Document input */}
      <div className="card" style={{ padding: 20 }}>
        <div className="output-label" style={{ marginBottom: 10 }}><FileSearch size={13} /> Document / Text</div>
        <textarea
          rows={10}
          placeholder="Paste your document, report, email, article, or any long text here…"
          value={doc}
          onChange={e => { setDoc(e.target.value); setOutput(''); }}
        />

        {/* Question input (only for Q&A mode) */}
        {mode.hasQuestion && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="What do you want to know about this document?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={analyze}
            disabled={!doc.trim() || (mode.hasQuestion && !question.trim()) || loading}
          >
            {loading ? '⏳ Analyzing…' : <><Sparkles size={15} /> Analyze</>}
          </button>
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="card" style={{ padding: 20 }}>
          <div className="output-label" style={{ marginBottom: 10 }}>
            <Sparkles size={13} /> {mode.label} Result
          </div>
          {loading
            ? <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Analyzing document…</div>
            : <div className="output-box animate-fade">{output}</div>
          }
        </div>
      )}
    </div>
  );
}
