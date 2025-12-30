
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification, AssistantMode } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { 
  ShieldAlert, Cpu, Settings, Camera, Zap, Terminal, BrainCircuit, Activity, BarChart3, X, Mic, MicOff, Info, Lock, ChevronRight, History, Power, Radio
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
      id: 'v1.2',
      sender: 'KERNEL',
      content: 'Neural Engine v1.2 core initialized. Secure connection established.',
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
    checkApiKeyStatus();
    return () => {
      stopAssistant();
      stopVision();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const checkApiKeyStatus = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      // Fallback for non-AI Studio environments (like local dev)
      setHasApiKey(true);
    }
  };

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage("Neural authentication failed.");
      }
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
    setNotifications(prev => [newNotif, ...prev].slice(0, 15));
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
      setErrorMessage("System requires audio sensor access.");
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
      addNotification('VISION', 'Optical synchronization active. Multimodal protocol online.', 'alert');
      
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
      setErrorMessage("Optical hardware failure.");
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
      // Proceed even if check is racey as per instructions
    }

    setStatus(AssistantStatus.THINKING);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      await initAudio();
      
      const config: any = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_INSTRUCTION + `\nStatus: Online. Core: Neural Engine v1.2. Mode: ${mode}.`,
        tools: [{ functionDeclarations: DEVICE_TOOLS }],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            setStatus(AssistantStatus.LISTENING);
            addNotification('KING', 'Secure Neural Link established.', 'message');
            
            if (audioContextRef.current && streamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              const silentGain = audioContextRef.current.createGain();
              silentGain.gain.value = 0;

              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(silentGain);
              silentGain.connect(audioContextRef.current.destination);
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
                if (fc.name === 'toggle_device_setting') {
                  setDeviceState(p => ({ ...p, [args.setting]: args.value }));
                  addNotification('HARDWARE', `Toggled system ${args.setting} to ${args.value}`, 'schedule');
                }
                if (fc.name === 'set_device_value') {
                  setDeviceState(p => ({ ...p, [args.setting]: args.value }));
                  addNotification('HARDWARE', `Adjusted ${args.setting} to ${args.value}%`, 'schedule');
                }
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
            setErrorMessage("Synaptic drift. Re-initializing Neural Engine...");
            if (e?.message?.includes('not found')) setHasApiKey(false);
          },
          onclose: () => { 
            setIsSessionActive(false); 
            setStatus(AssistantStatus.IDLE); 
            addNotification('SYSTEM', 'Neural Engine link offline.', 'alert');
          }
        },
        config
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setStatus(AssistantStatus.ERROR);
      setErrorMessage("Neural bridge failed to activate.");
    }
  };

  const stopAssistant = () => {
    sessionPromiseRef.current?.then(s => s.close());
    sessionPromiseRef.current = null;
    stopVision();
  };

  const isInteractionDisabled = status === AssistantStatus.THINKING || status === AssistantStatus.SPEAKING;

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select selection:bg-cyan-500/30">
      
      {/* 1. LAYERED PRODUCTION BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dynamic Bloom */}
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] transition-opacity duration-1000 ${isSessionActive ? 'opacity-100' : 'opacity-70'}`}></div>
        
        {/* Precision Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05] transition-transform duration-[2000ms]"
          style={{ 
            backgroundImage: `radial-gradient(circle at center, #22d3ee 0.5px, transparent 0.5px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: 'center center',
            transform: isSessionActive ? 'scale(1.1) rotate(0.5deg)' : 'scale(1)'
          }}
        ></div>

        {/* Ambient Neural Blobs */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.03)_0%,_transparent_60%)] transition-opacity duration-[1500ms] ${isSessionActive ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="glass w-full max-w-md rounded-[3.5rem] p-8 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.9)] border-white/10 ring-1 ring-cyan-500/20">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl font-black google-font tracking-tight flex items-center">
                  <BrainCircuit className="w-8 h-8 mr-4 text-cyan-400" />
                  Settings
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Kernel v1.2 Control</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-4 rounded-3xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Engine Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(AssistantMode).map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMode(m)} 
                      className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${mode === m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleOpenApiKeyDialog}
                  className="group w-full p-6 rounded-3xl bg-cyan-600/5 border border-cyan-500/20 text-cyan-400 flex items-center justify-between hover:bg-cyan-600/10 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <Cpu className="w-6 h-6" />
                    <div className="text-left">
                      <span className="text-[11px] font-black uppercase tracking-widest block">Update Link Token</span>
                      <span className="text-[8px] font-bold text-cyan-400/60 uppercase">Cloud Sync Active</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-6 border-t border-white/5 opacity-40">
                <div className="flex items-center space-x-3 text-slate-500">
                  <History className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Build 250314.1200_PROD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIDEBAR: MONITORING STATION */}
      <aside className="z-20 w-full md:w-[440px] shrink-0 p-4 md:p-8 flex flex-col space-y-6 glass border-b md:border-b-0 md:border-r border-white/10 max-h-[45dvh] md:max-h-full overflow-y-auto scrollbar-hide shadow-2xl relative">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center shadow-2xl border border-white/10 ring-1 ring-cyan-500/20 group cursor-pointer overflow-hidden">
              <img src="https://cdn-icons-png.flaticon.com/512/2593/2593635.png" alt="King AI" className="w-11 h-11 object-contain transition-transform group-hover:scale-110 duration-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black google-font tracking-tighter">KING AI</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center">
                <Radio className="w-3 h-3 mr-2 text-cyan-400 animate-pulse" />
                Neural Core v1.2
              </p>
            </div>
          </div>
          <div className="flex space-x-2.5">
            <button 
              onClick={isVisionActive ? stopVision : startVision} 
              className={`p-4 rounded-2xl border transition-all duration-500 ${isVisionActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}
            >
              <Camera className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-4 rounded-2xl border bg-white/5 border-white/10 text-slate-500 hover:text-white transition-all hover:bg-white/10"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {isVisionActive && (
            <div className="relative aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl shrink-0 group ring-1 ring-cyan-500/20">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.6)_100%)]"></div>
                <div className="absolute top-4 left-4 right-4 h-[1px] bg-cyan-400/40 animate-scan"></div>
                <div className="absolute bottom-8 left-8 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Live Feed: Synchronized</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass rounded-[3rem] p-8 space-y-7 shrink-0 border-white/5 shadow-inner ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
                <BarChart3 className="w-4 h-4 mr-3" /> Synaptic Activity
              </span>
              <span className="text-[10px] font-black text-cyan-400 tracking-widest animate-pulse uppercase">Processing</span>
            </div>
            <div className="flex space-x-3 h-12 items-end">
              {[35, 75, 50, 95, 65, 85, 45, 80, 60, 40, 90, 70, 55, 30].map((h, i) => (
                <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-lg transition-all duration-1000" style={{ height: `${isSessionActive ? h : 15}%` }}></div>
              ))}
            </div>
          </div>

          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={isInteractionDisabled}
          className={`w-full py-8 rounded-[2.5rem] font-black text-sm tracking-[0.4em] uppercase transition-all duration-500 active:scale-[0.97] shadow-[0_25px_60px_rgba(0,0,0,0.5)] group shrink-0 ${
            isSessionActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
              : 'bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-cyan-600/30 hover:shadow-cyan-500/60'
          } ${isInteractionDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center justify-center">
            {isSessionActive ? <MicOff className="w-6 h-6 mr-5" /> : <Mic className="w-6 h-6 mr-5 group-hover:scale-110 transition-transform" />}
            {status === AssistantStatus.THINKING ? 'Linking...' : status === AssistantStatus.SPEAKING ? 'Streaming...' : isSessionActive ? 'Sever Link' : 'Engage Link'}
          </span>
        </button>
      </aside>

      {/* 3. CENTER STAGE: NEURAL CORE */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full z-10">
        <header className="px-6 md:px-14 py-10 flex justify-between items-center w-full shrink-0 z-30">
          <div className="flex items-center space-x-6">
            <div className={`px-7 py-3 glass rounded-full flex items-center space-x-5 border-white/10 shadow-2xl transition-all duration-700 ${isSessionActive ? 'ring-2 ring-cyan-500/30 scale-105' : ''}`}>
               <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-slate-700 animate-pulse'}`}></div>
               <span className="text-[12px] font-black text-slate-300 tracking-[0.3em] uppercase">{isSessionActive ? 'System Linked' : 'System Standby'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-10">
            <div className="text-right hidden sm:block">
              <div className="text-lg font-black text-white tabular-nums tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Node 1.2</div>
            </div>
            <div className="w-16 h-16 glass rounded-[1.5rem] flex items-center justify-center border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors"></div>
               <Terminal className="w-7 h-7 text-slate-500 group-hover:text-cyan-400 transition-colors relative z-10" />
            </div>
          </div>
        </header>

        <div className="absolute top-28 left-0 right-0 z-40 px-6 md:px-14 flex flex-col items-center pointer-events-none">
          {errorMessage && (
            <div className="max-w-2xl w-full p-7 bg-red-500/10 border border-red-500/30 rounded-[3rem] text-red-200 text-[12px] font-black uppercase tracking-widest flex items-center space-x-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-12 pointer-events-auto backdrop-blur-3xl">
              <ShieldAlert className="w-7 h-7 text-red-500 shrink-0" />
              <span className="leading-relaxed flex-1">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="p-3 rounded-2xl hover:bg-red-500/20 transition-colors"><X className="w-6 h-6 text-red-500/50" /></button>
            </div>
          )}
        </div>

        {/* ORB AREA */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full z-10 px-4 md:px-14 min-h-0">
          {hasApiKey === false ? (
            <div className="max-w-md w-full p-12 glass border-cyan-500/20 rounded-[4rem] text-center space-y-10 shadow-[0_50px_120px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-28 h-28 rounded-full bg-cyan-500/5 flex items-center justify-center mx-auto border border-cyan-500/20 ring-1 ring-cyan-500/10">
                <Lock className="w-12 h-12 text-cyan-400" />
              </div>
              <div className="space-y-5">
                <h3 className="text-3xl font-black google-font tracking-tight text-white uppercase">Vault Restricted</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-6 opacity-60">Neural Engine Core 1.2 requires high-level authentication via Gemini API.</p>
              </div>
              <button 
                onClick={handleOpenApiKeyDialog} 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-800 text-white py-6 rounded-3xl font-black text-xs tracking-[0.4em] uppercase transition-all shadow-2xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Engage Core 1.2
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
               <div className={`transform transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isInteractionDisabled ? 'scale-95 opacity-50 blur-xl' : 'scale-100 md:scale-[1.3]'}`}>
                 <AssistantOrb status={status} />
               </div>
              
              {status === AssistantStatus.IDLE && !isInteractionDisabled && (
                <div className="absolute bottom-[15%] md:bottom-[10%] left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-16 duration-1000">
                  <button 
                    onClick={startAssistant}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-3xl px-16 py-6 rounded-full flex items-center space-x-8 group active:scale-95 transition-all shadow-[0_30px_70px_rgba(0,0,0,0.6)] hover:shadow-cyan-500/30 animate-pulse"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-[15px] animate-ping"></div>
                      <Mic className="w-8 h-8 text-cyan-400 relative z-10" />
                    </div>
                    <span className="text-[13px] font-black text-white tracking-[0.7em] uppercase">Initialize Link</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LOG PANEL */}
        <div className="w-full max-w-6xl px-6 md:px-14 pb-14 mt-auto z-20 shrink-0 mx-auto">
          <div className="h-[300px] glass rounded-[4rem] p-10 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-white/10 ring-1 ring-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] transition-opacity duration-1000 group-hover:opacity-[0.06]"></div>
            <NotificationPanel notifications={notifications} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
