/**
 * VoiceView.jsx — STEP 4: Voice Input (Speech-to-Text)
 * Uses real MediaRecorder + simulated (or real) Whisper STT.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, Check, Cpu } from 'lucide-react';
import { useRunAnywhere } from '../context/RunAnywhereContext';
import './Views.css';

export default function VoiceView() {
  const { sttStatus, initSTT, transcribe } = useRunAnywhere();
  const [recording, setRecording]       = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [audioLevel, setAudioLevel]     = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const analyserRef      = useRef(null);
  const animFrameRef     = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => { cancelAnimationFrame(animFrameRef.current); }, []);

  const startRecording = async () => {
    if (sttStatus !== 'ready') { await initSTT(); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Visualize audio level
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(avg / 80, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
        setLoading(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const text = await transcribe(blob);
          setTranscript(prev => (prev ? prev + '\n' : '') + text);
        } catch (err) {
          setTranscript('❌ Transcription failed: ' + err.message);
        }
        setLoading(false);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied: ' + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic mic button scale based on audio level
  const micScale = 1 + audioLevel * 0.18;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div className="view-header animate-fade" style={{ textAlign: 'center' }}>
        <h1>🎙️ Voice Input</h1>
        <p>Speak — your words appear as text in real time, processed entirely on-device.</p>
      </div>

      {sttStatus !== 'ready' && (
        <div className="model-load-banner animate-fade" style={{ width: '100%', maxWidth: 560 }}>
          <div className="model-load-info">
            <span className="text-lg">Load Whisper STT Model</span>
            <span className="text-muted">~40MB · runs locally, no uploads.</span>
          </div>
          <button className="btn btn-primary" onClick={initSTT}>
            <Cpu size={15} /> Load STT
          </button>
        </div>
      )}

      {/* Mic button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          {/* Ring glow while recording */}
          {recording && (
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              animation: 'pulse-ring 1s ease infinite',
            }} />
          )}
          <button
            className={`mic-btn${recording ? ' recording' : ''}`}
            style={{ transform: `scale(${recording ? micScale : 1})`, transition: 'transform 0.1s ease' }}
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: recording ? 'var(--danger)' : 'var(--text-2)' }}>
          {loading ? '⏳ Transcribing…' : recording ? '● Recording… tap to stop' : 'Tap to speak'}
        </div>
      </div>

      {/* Transcript output */}
      <div className="card" style={{ padding: 20, width: '100%', maxWidth: 660 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="output-label">Transcript</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {transcript && (
              <>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={copy}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setTranscript('')}>Clear</button>
              </>
            )}
          </div>
        </div>
        <div className="output-box" style={{ minHeight: 140 }}>
          {transcript || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Your speech will appear here…</span>}
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', textAlign: 'center', maxWidth: 420 }}>
        🔒 Audio never leaves your device. Whisper runs locally via WebAssembly.
      </p>
    </div>
  );
}
