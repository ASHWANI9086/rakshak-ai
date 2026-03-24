/**
 * RunAnywhereContext.jsx — Optimized SDK Provider
 *
 * Fixes: "Model not loaded before trying to complete ChatCompletionRequest"
 * Architecture: Singleton MLCEngine instance, strict state tracking, one-time reload.
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { MLCEngine } from '@mlc-ai/web-llm';

export const DEFAULT_LLM_MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
const MAX_RETRIES = 3;

export const LOAD_STAGES = {
  CHECKING:   { id: 'checking',   label: 'Checking browser support…', pct: 2  },
  FETCHING:   { id: 'fetching',   label: 'Downloading model weights…', pct: 10 },
  COMPILING:  { id: 'compiling',  label: 'Compiling WebGPU shaders…',  pct: 75 },
  WARMING:    { id: 'warming',    label: 'Warming up inference engine…', pct: 95 },
  READY:      { id: 'ready',      label: 'Model ready!',               pct: 100 },
};

export const ERROR_TYPES = {
  NO_WEBGPU:  'no_webgpu',
  OOM:        'oom',
  NETWORK:    'network',
  API_KEY:    'api_key',
  TIMEOUT:    'timeout',
  GENERIC:    'generic',
};

const Context = createContext(null);

export function RunAnywhereProvider({ children }) {
  // 1. Singleton Engine Reference
  const engineRef = useRef(null);
  const sttRef    = useRef(null);
  const retryRef  = useRef(0);
  const cachedRef = useRef(false);

  // 2. Strict UI States
  const [llmStatus,    setLlmStatus]    = useState('idle'); // idle|loading|ready|error
  const [loadStage,    setLoadStage]    = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorType,    setErrorType]    = useState(null);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [retryCount,   setRetryCount]   = useState(0);
  const [isCached,     setIsCached]     = useState(false);

  // STT state
  const [sttStatus, setSttStatus] = useState('idle');

  const checkWebGPU = useCallback(async () => {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch { return false; }
  }, []);

  const checkModelCached = useCallback(async () => {
    try {
      const caches = await window.caches.keys();
      return caches.some(k => k.includes('webllm') || k.includes('mlc'));
    } catch { return false; }
  }, []);

  // 3. Initialize & Reload Model (Protected against multiple calls)
  const _doLoad = useCallback(async (modelId) => {
    setLoadStage(LOAD_STAGES.CHECKING);
    setLoadProgress(LOAD_STAGES.CHECKING.pct);

    const hasGPU = await checkWebGPU();
    if (!hasGPU) {
      throw Object.assign(
        new Error('WebGPU is not available in this browser.'),
        { errorType: ERROR_TYPES.NO_WEBGPU }
      );
    }

    const cached = await checkModelCached();
    cachedRef.current = cached;
    setIsCached(cached);
    setLoadStage(LOAD_STAGES.FETCHING);
    setLoadProgress(LOAD_STAGES.FETCHING.pct);

    // Instantiate MLCEngine explicitly
    if (!engineRef.current) {
      engineRef.current = new MLCEngine();
    }

    // AWAIT the reload properly BEFORE marking as ready
    await engineRef.current.reload(modelId, {
      initProgressCallback: (prog) => {
        const rawPct  = prog.progress ?? 0;
        const text    = (prog.text ?? '').toLowerCase();

        if (text.includes('shader') || text.includes('compil')) {
          setLoadStage(LOAD_STAGES.COMPILING);
          setLoadProgress(Math.min(LOAD_STAGES.COMPILING.pct + Math.round(rawPct * 20), 94));
        } else if (text.includes('warm') || rawPct > 0.97) {
          setLoadStage(LOAD_STAGES.WARMING);
          setLoadProgress(LOAD_STAGES.WARMING.pct);
        } else {
          setLoadProgress(Math.min(LOAD_STAGES.FETCHING.pct + Math.round(rawPct * 64), 74));
        }
      },
    });

    setLoadStage(LOAD_STAGES.WARMING);
    setLoadProgress(LOAD_STAGES.WARMING.pct);
    try {
      await engineRef.current.chat.completions.create({
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      });
    } catch { /* ignore warmup errors */ }

    // ONLY set to 'ready' after await resolves
    setLoadStage(LOAD_STAGES.READY);
    setLoadProgress(100);
  }, [checkWebGPU, checkModelCached]);

  const initLLM = useCallback(async (modelId = DEFAULT_LLM_MODEL) => {
    if (llmStatus === 'ready' || llmStatus === 'loading') return;

    const attempt = retryRef.current + 1;
    retryRef.current = attempt;
    setRetryCount(attempt);
    setLlmStatus('loading');
    setLoadProgress(0);
    setLoadStage(null);
    setErrorType(null);
    setErrorMsg('');

    try {
      await _doLoad(modelId);
      setLlmStatus('ready'); // <--- Protects UI
    } catch (err) {
      const { type, message } = classifyError(err);
      setErrorType(type);
      setErrorMsg(message);
      setLlmStatus('error');
    }
  }, [llmStatus, _doLoad]);

  const retryLLM = useCallback(() => {
    if (retryRef.current >= MAX_RETRIES) return;
    setLlmStatus('idle');
    setTimeout(() => initLLM(), 100);
  }, [initLLM]);

  const canRetry = retryCount < MAX_RETRIES;

  const initSTT = useCallback(async () => {
    if (sttStatus === 'ready' || sttStatus === 'loading') return;
    setSttStatus('loading');
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        sttRef.current = createWebSpeechSTT();
      } else {
        sttRef.current = createSimulatedSTT();
      }
      setSttStatus('ready');
    } catch {
      setSttStatus('error');
    }
  }, [sttStatus]);

  // 4. Safe Chat Wrapper — Double safeguard
  const chatStream = useCallback(async function* (messages) {
    if (llmStatus !== 'ready' || !engineRef.current) {
      throw new Error('Cannot chat: Model is not loaded completely yet.');
    }
    const stream = await engineRef.current.chat.completions.create({ messages, stream: true });
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }, [llmStatus]);

  const complete = useCallback(async (prompt, systemPrompt = '') => {
    if (llmStatus !== 'ready' || !engineRef.current) {
      throw new Error('Cannot chat: Model is not loaded completely yet.');
    }
    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ];
    const res = await engineRef.current.chat.completions.create({ messages });
    return res.choices[0].message.content;
  }, [llmStatus]);

  const transcribe = useCallback(async (audioBlob) => {
    if (!sttRef.current) throw new Error('STT not initialized.');
    return sttRef.current.transcribe(audioBlob);
  }, []);

  return (
    <Context.Provider value={{
      llmStatus, sttStatus, loadStage, loadProgress, errorType, errorMsg,
      retryCount, canRetry, isCached,
      initLLM, retryLLM, initSTT, chatStream, complete, transcribe,
    }}>
      {children}
    </Context.Provider>
  );
}

export function useRunAnywhere() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useRunAnywhere must be inside <RunAnywhereProvider>');
  return ctx;
}

// Helpers
function classifyError(err) {
  const msg = (err?.message ?? String(err)).toLowerCase();
  const type = err?.errorType;
  if (type === ERROR_TYPES.NO_WEBGPU || msg.includes('webgpu') || !navigator.gpu) {
    return { type: ERROR_TYPES.NO_WEBGPU, message: "Use Chrome 113+ with hardware acceleration." };
  }
  if (msg.includes('out of memory') || msg.includes('oom')) return { type: ERROR_TYPES.OOM, message: "Close tabs and retry." };
  if (msg.includes('fetch') || msg.includes('network')) return { type: ERROR_TYPES.NETWORK, message: "Check connection." };
  if (msg.includes('api') || msg.includes('key')) return { type: ERROR_TYPES.API_KEY, message: "Invalid API key." };
  return { type: ERROR_TYPES.GENERIC, message: `Error: ${err?.message ?? err}` };
}

function createWebSpeechSTT() {
  return {
    transcribe: () => new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r  = new SR();
      r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
      r.onresult = e => resolve(e.results[0][0].transcript);
      r.onerror  = e => reject(new Error(e.error));
      r.start();
    }),
  };
}
function createSimulatedSTT() {
  return { transcribe: () => new Promise(r => setTimeout(() => r('Simulation mode'), 900)) };
}
