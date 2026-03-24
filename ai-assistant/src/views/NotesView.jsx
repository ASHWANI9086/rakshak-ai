/**
 * NotesView.jsx — STEP 6: Smart Notes + Summarization
 * Paste long text → summarize, extract key points, or get action items.
 */
import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, List, CheckSquare, Save, Trash2 } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

const STORAGE_KEY = 'private-ai-notes';

const ANALYZE_MODES = [
  {
    id: 'summary', label: 'Summarize', icon: Sparkles,
    prompt: (text) => `Summarize the following text in 3–5 clear bullet points:\n\n${text}\n\nSummary:`,
    system: 'You are an expert at creating clear, concise summaries.',
  },
  {
    id: 'keypoints', label: 'Key Points', icon: List,
    prompt: (text) => `Extract the most important key points from this text (numbered list):\n\n${text}\n\nKey Points:`,
    system: 'You extract and list the most important points from text clearly.',
  },
  {
    id: 'actions', label: 'Action Items', icon: CheckSquare,
    prompt: (text) => `Extract all actionable tasks or action items from this text:\n\n${text}\n\nAction Items:`,
    system: 'You identify and list concrete action items from text.',
  },
];

export default function NotesView() {
  const { llmStatus, initLLM, complete } = useRunAnywhere();
  const [noteText, setNoteText]   = useState('');
  const [output, setOutput]       = useState('');
  const [activeMode, setActiveMode] = useState(ANALYZE_MODES[0]);
  const [loading, setLoading]     = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);

  // Load saved notes from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setSavedNotes(stored);
  }, []);

  const analyze = async () => {
    if (!noteText.trim()) return;
    if (llmStatus !== 'ready') { initLLM(); return; }
    setLoading(true); setOutput('');
    try {
      const result = await complete(activeMode.prompt(noteText), activeMode.system);
      setOutput(result);
    } catch (err) { setOutput(`❌ ${err.message}`); }
    setLoading(false);
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    const note = {
      id: Date.now(),
      preview: noteText.slice(0, 100),
      content: noteText,
      analysis: output,
      timestamp: new Date().toLocaleString(),
    };
    const updated = [note, ...savedNotes].slice(0, 20); // keep latest 20
    setSavedNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteNote = (id) => {
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="view-header animate-fade">
        <h1>📒 Smart Notes</h1>
        <p>Paste long text and extract summaries, key points, or action items — instantly.</p>
      </div>

      <div className="notes-grid">
        {/* Input + Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="output-label" style={{ marginBottom: 10 }}><FileText size={13} /> Your Note / Text</div>
            <textarea
              rows={10}
              placeholder="Paste your notes, article, meeting transcript, or any long text here…"
              value={noteText}
              onChange={e => { setNoteText(e.target.value); setOutput(''); }}
            />
            {/* Mode selector */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {ANALYZE_MODES.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    className={`btn ${activeMode.id === mode.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                    onClick={() => setActiveMode(mode)}
                  >
                    <Icon size={13} /> {mode.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary" onClick={analyze} disabled={!noteText.trim() || loading}>
                {loading ? '⏳ Analyzing…' : <><Sparkles size={14} /> Analyze</>}
              </button>
              <button className="btn btn-outline" onClick={saveNote} disabled={!noteText.trim()} title="Save note">
                <Save size={14} /> Save
              </button>
            </div>
          </div>

          {(output || loading) && (
            <div className="card" style={{ padding: 18 }}>
              <div className="output-label" style={{ marginBottom: 8 }}><Sparkles size={13} /> {activeMode.label} Result</div>
              {loading
                ? <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Analyzing your text…</div>
                : <div className="output-box animate-fade">{output}</div>
              }
            </div>
          )}
        </div>

        {/* Saved Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="text-lg" style={{ padding: '4px 0' }}>Saved Notes ({savedNotes.length})</div>
          {savedNotes.length === 0 && (
            <div className="card" style={{ padding: 20, color: 'var(--text-3)', textAlign: 'center', fontSize: '0.9rem' }}>
              No saved notes yet. Analyze some text and hit Save!
            </div>
          )}
          {savedNotes.map(note => (
            <div key={note.id} className="card" style={{ padding: 16, cursor: 'pointer' }}
              onClick={() => { setNoteText(note.content); setOutput(note.analysis || ''); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 4 }}>{note.timestamp}</div>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{note.preview}…</div>
                </div>
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)', flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); deleteNote(note.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
