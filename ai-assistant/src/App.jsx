/**
 * App.jsx — Root shell with premium topbar
 */
import React, { useState } from 'react';
import { RunAnywhereProvider }  from './context/RunAnywhereContext';
import Sidebar, { VIEWS }       from './components/Sidebar';
import ModelLoader               from './components/ModelLoader';
import ChatView                  from './views/ChatView';
import WritingView               from './views/WritingView';
import NotesView                 from './views/NotesView';
import VoiceView                 from './views/VoiceView';
import AnalyzeView               from './views/AnalyzeView';
import CodeView                  from './views/CodeView';
import { Shield }                from 'lucide-react';
import './components/Layout.css';

const VIEW_MAP = {
  chat:    { component: ChatView,    title: 'AI Chat',           sub: 'Offline LLM · No cloud, no waiting'           },
  write:   { component: WritingView, title: 'Writing Assistant', sub: 'Emails, summaries & polished content'          },
  notes:   { component: NotesView,   title: 'Smart Notes',       sub: 'Summarize · Key Points · Action Items'        },
  voice:   { component: VoiceView,   title: 'Voice Input',       sub: 'Speak · local Whisper converts speech to text' },
  analyze: { component: AnalyzeView, title: 'Document Analyzer', sub: 'Paste any text · summarize, Q&A, or extract'  },
  code:    { component: CodeView,    title: 'Code Explainer',    sub: 'Explain · Debug · Document · Refactor'        },
};

function AppShell() {
  const [active, setActive] = useState('chat');
  const { component: View, title, sub } = VIEW_MAP[active];

  return (
    <div className="app-layout">
      <ModelLoader />
      <Sidebar activeView={active} setActiveView={setActive} />

      <main className="main-content">
        {/* Glass topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Shield size={18} color="#3b82f6" strokeWidth={2.5} />
              {title}
            </div>
            <div className="topbar-sub">{sub}</div>
          </div>
          <div className="topbar-right">
            <div className="badge badge-glass" style={{ gap:6 }}>
              <Shield size={11} color="var(--success)" />
              <span style={{ color:'var(--success)', fontWeight:700 }}>Rakshak AI · 100% Local</span>
            </div>
          </div>
        </header>

        {/* Active view */}
        <div className="view-container" key={active}>
          <View />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RunAnywhereProvider>
      <AppShell />
    </RunAnywhereProvider>
  );
}
