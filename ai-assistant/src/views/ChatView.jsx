/**
 * ChatView.jsx — Premium AI Chat
 * Features: streaming, AI thinking state, animated typing dots, floating send FAB
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Cpu, Send } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

const WELCOME = {
  id: 'w0', role: 'assistant',
  content: "👋 Hi! I'm your private AI assistant — running 100% in your browser, no cloud needed.\n\nAsk me anything: write emails, explain concepts, summarize text, debug code, or just chat.",
};

// State: 'idle' | 'thinking' | 'streaming'
export default function ChatView() {
  const { llmStatus, initLLM, chatStream } = useRunAnywhere();
  const [messages, setMessages]     = useState([WELCOME]);
  const [input, setInput]           = useState('');
  const [aiState, setAiState]       = useState('idle'); // idle | thinking | streaming
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiState]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || aiState !== 'idle') return;
    if (llmStatus !== 'ready') { initLLM(); return; }

    const userMsg = { id: Date.now(),     role: 'user',      content: text };
    const aiMsg   = { id: Date.now() + 1, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setAiState('thinking');

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      let fullContent = '';
      let firstToken  = true;

      for await (const token of chatStream(history)) {
        if (firstToken) { setAiState('streaming'); firstToken = false; }
        fullContent += token;
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id ? { ...m, content: fullContent } : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, content: `❌ ${err.message}` } : m
      ));
    }
    setAiState('idle');
  }, [input, aiState, llmStatus, messages, chatStream, initLLM]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="chat-wrap">
      {/* Load model banner */}
      {llmStatus === 'idle' && (
        <div className="model-load-banner animate-fade-up">
          <div className="model-load-info">
            <strong>Load Local AI Model</strong>
            <span>One-time ~500MB download · cached in browser · 100% private</span>
          </div>
          <button className="btn btn-primary" onClick={initLLM}>
            <Cpu size={15} /> Load Model
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.role === 'user' ? 'user' : ''}`}
            style={{ animationDelay: `${idx * 0.03}s` }}
          >
            <div className={`bubble-avatar ${msg.role === 'user' ? 'avatar-user' : 'avatar-ai'}`}>
              {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div className="chat-text">
              {msg.content || (
                /* Empty content = this is the pending AI message */
                aiState === 'thinking'
                  ? (
                    <div className="ai-thinking">
                      <div className="think-spinner" />
                      AI is thinking…
                    </div>
                  )
                  : (
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything… (Enter to send · Shift+Enter for new line)"
          rows={2}
          disabled={aiState !== 'idle'}
        />
        <button
          className="send-btn"
          onClick={send}
          disabled={!input.trim() || aiState !== 'idle'}
          title="Send"
          aria-label="Send message"
        >
          {aiState !== 'idle'
            ? <div style={{ width:20, height:20, border:'2.5px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            : <Send size={20} strokeWidth={2.5} />
          }
        </button>
      </div>
    </div>
  );
}
