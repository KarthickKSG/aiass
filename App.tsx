
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification, AssistantMode } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { 
  ShieldAlert, Cpu, Settings, Camera, Zap, Terminal, BrainCircuit, Activity, BarChart3, X, Mic, MicOff, Info, Lock
} from 'lucide-react';

const FRAME_RATE = 1;
const JPEG_QUALITY = 0.5;

const App: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.IDLE);
  const [mode, setMode] = useState<AssistantMode>(AssistantMode.PRECISION);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const [deviceState, setDeviceState] = useState<DeviceState>({
    wifi: true,
    bluetooth: true,
    mobileData: false,
    airplaneMode: false,
    flashlight: false,
    silentMode: false,
    gamingMode: false,
    brightness: 85,
    volume: 60,
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      sender: 'KING CORE',
      content: 'Quantum protocols established. Ready for synaptic transmission.',
      timestamp: new Date(),
      type: 'alert'
    }
  ]);
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isVisionActive, setIsVisionActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    checkApiKey();
    return () => {
      stopAssistant();
      stopVision();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addNotification = (sender: string, content: string, type: 'message' | 'alert' | 'schedule') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      sender: sender.toUpperCase(),
      content,
      timestamp: new Date(),
      type
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      setErrorMessage("Microphone access denied. Synaptic link severed.");
      throw err;
    }
  };

  const startVision = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      videoStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsVisionActive(true);
      
      visionIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionPromiseRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            canvasRef.current.toBlob(async (blob) => {
              if (blob && sessionPromiseRef.current) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64Data = (reader.result as string).split(',')[1];
                  sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', JPEG_QUALITY);
          }
        }
      }, 1000 / FRAME_RATE);
    } catch (err) {
      setErrorMessage("Vision sensor error. Core bypass enabled.");
    }
  };

  const stopVision = () => {
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
    if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach(t => t.stop());
    setIsVisionActive(false);
  };

  const startAssistant = async () => {
    setErrorMessage(null);

    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
      await handleOpenApiKeyDialog();
    }

    setStatus(AssistantStatus.THINKING);
    try {
      await initAudio();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config: any = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_INSTRUCTION + `\nCurrently in ${mode} mode. Adjust complexity accordingly.`,
        tools: [{ functionDeclarations: DEVICE_TOOLS }],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      };

      if (mode === AssistantMode.PRECISION) {
        config.thinkingConfig = { thinkingBudget: 24576 };
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            setStatus(AssistantStatus.LISTENING);
            addNotification('SYSTEM', 'Neural link established.', 'alert');
            
            if (audioContextRef.current && streamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setStatus(AssistantStatus.SPEAKING);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus(AssistantStatus.LISTENING);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                let res = "ok";
                const args = fc.args as any;
                if (fc.name === 'toggle_device_setting') setDeviceState(p => ({ ...p, [args.setting]: args.value }));
                if (fc.name === 'set_device_value') setDeviceState(p => ({ ...p, [args.setting]: args.value }));
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: res } } }));
              }
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            if (e?.message?.includes('not found')) {
              setHasApiKey(false);
              setErrorMessage("API Key rejected. Re-authentication required.");
            } else {
              setErrorMessage("Neural feedback error. Re-syncing...");
            }
          },
          onclose: () => { setIsSessionActive(false); setStatus(AssistantStatus.IDLE); }
        },
        config
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setStatus(AssistantStatus.ERROR);
      setErrorMessage(err.message || "Cognitive initialization failed.");
    }
  };

  const stopAssistant = () => {
    sessionPromiseRef.current?.then(s => s.close());
    sessionPromiseRef.current = null;
    stopVision();
  };

  const isInteractionDisabled = status === AssistantStatus.THINKING || status === AssistantStatus.SPEAKING;

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select">
      {/* Background FX */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
         <div className={`absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900/10 to-transparent transition-opacity duration-1000 ${isSessionActive ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="glass w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border-white/10 ring-1 ring-cyan-500/20">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black google-font tracking-tight flex items-center">
                <BrainCircuit className="w-6 h-6 mr-3 text-cyan-400" />
                Kernel Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Synaptic Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AssistantMode).map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all border ${mode === m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Authentication Core</label>
                <button 
                  onClick={handleOpenApiKeyDialog}
                  className="w-full p-5 rounded-3xl bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-between hover:bg-cyan-600/20 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <Cpu className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Update API Key</span>
                  </div>
                  <Info className="w-4 h-4 opacity-50" />
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[8px] font-bold text-slate-600 uppercase tracking-widest px-1 text-center hover:text-cyan-400">GCP Billing Documentation Required</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Controls & Feed */}
      <aside className="z-20 w-full md:w-85 lg:w-96 shrink-0 p-4 md:p-6 flex flex-col space-y-5 glass border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center shadow-lg border border-white/10">
              <img src="https://cdn-icons-png.flaticon.com/512/2593/2593635.png" alt="King AI" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black google-font tracking-tighter">KING AI</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Quantum Core v2.5</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={isVisionActive ? stopVision : startVision} className={`p-3 rounded-2xl border transition-all ${isVisionActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}><Camera className="w-5 h-5" /></button>
            <button onClick={() => setShowSettings(true)} className="p-3 rounded-2xl border bg-white/5 border-white/10 text-slate-500 transition-all"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-5">
          {isVisionActive && (
            <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute top-4 left-4 right-4 h-[1px] bg-cyan-400/30 animate-scan"></div>
            </div>
          )}

          <div className="glass rounded-[2.5rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center"><BarChart3 className="w-3.5 h-3.5 mr-2" /> Load State</span>
              <span className="text-[10px] font-black text-cyan-400 animate-pulse">OPTIMIZED</span>
            </div>
            <div className="flex space-x-2 h-8 items-end">
              {[30, 60, 45, 90, 65, 80, 50, 85, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-md transition-all duration-700" style={{ height: `${isSessionActive ? h : 15}%` }}></div>
              ))}
            </div>
          </div>

          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={isInteractionDisabled}
          className={`w-full py-6 rounded-[2rem] font-black text-[11px] tracking-[0.5em] uppercase transition-all duration-700 active:scale-95 group ${
            isSessionActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
              : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg'
          } ${isInteractionDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
          <span className="flex items-center justify-center">
            {isSessionActive ? <MicOff className="w-4 h-4 mr-3" /> : <Mic className="w-4 h-4 mr-3 group-hover:scale-110" />}
            {status === AssistantStatus.THINKING ? 'THINKING...' : status === AssistantStatus.SPEAKING ? 'SPEAKING...' : isSessionActive ? 'TERMINATE LINK' : 'ENGAGE KING'}
          </span>
        </button>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="z-10 flex-1 flex flex-col items-center px-4 py-6 md:px-10 md:py-8 overflow-hidden">
        <header className="flex justify-between items-center mb-10 w-full max-w-5xl">
          <div className="flex items-center space-x-4">
            <div className={`px-5 py-2 glass rounded-full flex items-center space-x-3 border-white/5 ${isSessionActive ? 'ring-1 ring-cyan-500/30' : ''}`}>
               <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`}></div>
               <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">{isSessionActive ? 'SYNAPSE ACTIVE' : 'STANDBY'}</span>
            </div>
          </div>
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-white/5"><Terminal className="w-5 h-5 text-slate-500" /></div>
        </header>

        {errorMessage && (
          <div className="max-w-lg w-full mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-200 text-[10px] font-black uppercase tracking-widest flex items-center space-x-4 animate-in slide-in-from-top-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {hasApiKey === false && (
          <div className="max-w-lg w-full mb-8 p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] text-cyan-100 flex flex-col items-center space-y-4 shadow-2xl">
            <Lock className="w-10 h-10 text-cyan-400" />
            <h3 className="font-black text-sm tracking-widest uppercase">Encryption Key Required</h3>
            <p className="text-[10px] text-center opacity-70 leading-relaxed uppercase tracking-tighter">You must select a paid API key from your Google AI Studio project to access high-bandwidth neural features.</p>
            <button onClick={handleOpenApiKeyDialog} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-8 py-3 rounded-full font-black text-[10px] tracking-widest uppercase transition-all shadow-lg">Authenticate Core</button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center w-full group relative">
          <div className={`transform transition-all duration-1000 ${isInteractionDisabled ? 'scale-95 opacity-80' : 'scale-110 md:scale-125'}`}>
            <AssistantOrb status={status} />
          </div>
          
          {status === AssistantStatus.IDLE && !isInteractionDisabled && (
            <button 
              onClick={startAssistant}
              className="mt-8 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl px-10 py-4 rounded-full flex items-center space-x-4 group active:scale-95 transition-all shadow-2xl"
            >
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[11px] font-black text-white tracking-[0.5em] uppercase">Initialize Voice Link</span>
            </button>
          )}
        </div>

        <div className="w-full max-w-2xl mt-8">
          <div className="h-[260px] glass rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <NotificationPanel notifications={notifications} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
