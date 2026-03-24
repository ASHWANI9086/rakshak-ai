/**
 * CodeView.jsx — STEP 7 (Optional): Code Explainer
 * Paste code → explain, find bugs, or generate docstring.
 */
import React, { useState } from 'react';
import { Code2, Bug, FileText as DocIcon, Wand2 } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

const MODES = [
  {
    id: 'explain', label: 'Explain Code', icon: Code2,
    prompt: (code, lang) => `Explain what this ${lang} code does in simple, clear terms:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nExplanation:`,
    system: 'You are a senior developer who explains code clearly to both beginners and experts.',
  },
  {
    id: 'bugs', label: 'Find Bugs', icon: Bug,
    prompt: (code, lang) => `Review this ${lang} code and identify any bugs, issues, or potential improvements:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nBugs & Issues:`,
    system: 'You are an expert code reviewer who finds bugs and suggests improvements.',
  },
  {
    id: 'docs', label: 'Generate Docs', icon: DocIcon,
    prompt: (code, lang) => `Write clear documentation and docstrings for this ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nDocumentation:`,
    system: 'You write clear, concise documentation and docstrings for code.',
  },
  {
    id: 'refactor', label: 'Suggest Refactor', icon: Wand2,
    prompt: (code, lang) => `Suggest how to refactor and improve this ${lang} code for readability and performance:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nRefactored version with explanation:`,
    system: 'You are an expert who refactors code for better readability and performance.',
  },
];

const LANGUAGES = ['javascript', 'python', 'typescript', 'java', 'c++', 'c#', 'rust', 'go', 'swift', 'kotlin', 'php', 'sql'];

export default function CodeView() {
  const { llmStatus, initLLM, complete } = useRunAnywhere();
  const [code, setCode]   = useState('');
  const [lang, setLang]   = useState('javascript');
  const [mode, setMode]   = useState(MODES[0]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!code.trim()) return;
    if (llmStatus !== 'ready') { initLLM(); return; }
    setLoading(true); setOutput('');
    try {
      const result = await complete(mode.prompt(code, lang), mode.system);
      setOutput(result);
    } catch (err) { setOutput(`❌ ${err.message}`); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="view-header animate-fade">
        <h1>💻 Code Explainer</h1>
        <p>Paste any code — get explanations, bug detection, docs, or refactoring suggestions.</p>
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

      {/* Language selector + code input */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="output-label" style={{ margin: 0 }}>Language:</div>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            style={{
              fontFamily: 'inherit', fontSize: '0.88rem', padding: '6px 12px',
              borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-1)', outline: 'none', cursor: 'pointer',
            }}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <textarea
          className="code-textarea"
          rows={12}
          placeholder={`// Paste your ${lang} code here…`}
          value={code}
          onChange={e => { setCode(e.target.value); setOutput(''); }}
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={run} disabled={!code.trim() || loading}>
            {loading ? '⏳ Analyzing…' : <><Code2 size={14} /> {mode.label}</>}
          </button>
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="card" style={{ padding: 20 }}>
          <div className="output-label" style={{ marginBottom: 10 }}>
            <mode.icon size={13} /> {mode.label} Result
          </div>
          {loading
            ? <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Processing your code…</div>
            : <div className="output-box animate-fade">{output}</div>
          }
        </div>
      )}
    </div>
  );
}
