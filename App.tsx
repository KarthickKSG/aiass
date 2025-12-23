
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification, AssistantMode } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { 
  ShieldAlert, Cpu, Settings, Camera, Zap, Terminal, BrainCircuit, Activity, BarChart3, X, Mic, MicOff, Info, Lock, ChevronRight
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
    }
  };

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage("Authentication gateway failed to respond.");
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
      setErrorMessage("Microphone access is restricted. Check system permissions.");
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
      setErrorMessage("Visual sensors offline.");
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
              setErrorMessage("API Key handshake failed. Please re-authenticate.");
            } else {
              setErrorMessage("Synaptic drift detected. Re-syncing link...");
            }
          },
          onclose: () => { setIsSessionActive(false); setStatus(AssistantStatus.IDLE); }
        },
        config
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setStatus(AssistantStatus.ERROR);
      setErrorMessage(err.message || "Failed to establish cognitive link.");
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
      {/* Background Ambient Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-blue-950/20 transition-opacity duration-1000 ${isSessionActive ? 'opacity-100' : 'opacity-40'}`}></div>
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_#22d3ee_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="glass w-full max-w-md rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-white/10 ring-1 ring-cyan-500/20">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl font-black google-font tracking-tight flex items-center">
                  <BrainCircuit className="w-8 h-8 mr-4 text-cyan-400" />
                  Kernel Control
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Core System Settings</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Synaptic Processing Mode</label>
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
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Security & Authentication</label>
                <div className="space-y-4">
                  <button 
                    onClick={handleOpenApiKeyDialog}
                    className="group w-full p-6 rounded-3xl bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-between hover:bg-cyan-600/20 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-4">
                      <Cpu className="w-6 h-6" />
                      <div className="text-left">
                        <span className="text-[11px] font-black uppercase tracking-widest block">Update API Key</span>
                        <span className="text-[8px] font-bold text-cyan-400/60 uppercase">AES-256 Encrypted Storage</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center space-x-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 hover:text-cyan-400 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    <span>View Cloud Billing Documentation</span>
                  </a>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">System Health</span>
                  <span className="text-xs font-bold text-cyan-400 uppercase">Integrity Nominal</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Activity className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Diagnostics & Environment (Hidden on smallest screens, scrolls on mobile) */}
      <aside className="z-20 w-full md:w-[380px] shrink-0 p-4 md:p-8 flex flex-col space-y-6 glass border-b md:border-b-0 md:border-r border-white/5 max-h-[40dvh] md:max-h-full overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center shadow-2xl border border-white/10">
              <img src="https://cdn-icons-png.flaticon.com/512/2593/2593635.png" alt="King AI" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black google-font tracking-tighter">KING AI</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Synaptic Link 2.5</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={isVisionActive ? stopVision : startVision} 
              className={`p-4 rounded-2xl border transition-all ${isVisionActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            >
              <Camera className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-4 rounded-2xl border bg-white/5 border-white/10 text-slate-500 hover:text-white transition-all hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {isVisionActive && (
            <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shrink-0 group">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.6)_100%)]"></div>
                <div className="absolute top-4 left-4 right-4 h-[1px] bg-cyan-400/30 animate-scan"></div>
                <div className="absolute bottom-6 left-6 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Live Encryption</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass rounded-[2.5rem] p-7 space-y-6 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center"><BarChart3 className="w-4 h-4 mr-3" /> Synaptic Load</span>
              <span className="text-[9px] font-black text-cyan-400 tracking-widest animate-pulse">STABLE</span>
            </div>
            <div className="flex space-x-2.5 h-10 items-end">
              {[35, 70, 45, 95, 60, 85, 40, 75, 55, 30, 90, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-lg transition-all duration-700 hover:bg-cyan-500/40" style={{ height: `${isSessionActive ? h : 15}%` }}></div>
              ))}
            </div>
          </div>

          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={isInteractionDisabled}
          className={`w-full py-7 rounded-[2rem] font-black text-xs tracking-[0.4em] uppercase transition-all duration-500 active:scale-[0.96] shadow-2xl group shrink-0 ${
            isSessionActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
              : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-cyan-600/30 hover:shadow-cyan-500/50'
          } ${isInteractionDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
        >
          <span className="flex items-center justify-center">
            {isSessionActive ? <MicOff className="w-5 h-5 mr-4" /> : <Mic className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />}
            {status === AssistantStatus.THINKING ? 'THINKING...' : status === AssistantStatus.SPEAKING ? 'SPEAKING...' : isSessionActive ? 'Sever Link' : 'Initialize Command'}
          </span>
        </button>
      </aside>

      {/* MAIN VIEWPORT: Interaction Core */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Top Navigation / Status Header */}
        <header className="px-6 md:px-12 py-8 flex justify-between items-center w-full shrink-0 z-30">
          <div className="flex items-center space-x-6">
            <div className={`px-6 py-2.5 glass rounded-full flex items-center space-x-4 border-white/5 shadow-xl transition-all ${isSessionActive ? 'ring-2 ring-cyan-500/30' : ''}`}>
               <div className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-700 animate-pulse'}`}></div>
               <span className="text-[11px] font-black text-slate-300 tracking-[0.3em] uppercase">{isSessionActive ? 'Core Sync Active' : 'Standby Protocol'}</span>
            </div>
            {isSessionActive && (
              <div className="hidden lg:flex items-center space-x-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <Cpu className="w-3.5 h-3.5" />
                <span>Node: Gemini-2.5-Native</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="text-right hidden sm:block">
              <div className="text-base font-black text-white tabular-nums tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Synaptic Pulse</div>
            </div>
            <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-inner">
               <Terminal className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        </header>

        {/* Dynamic Alerts Layer */}
        <div className="absolute top-24 left-0 right-0 z-40 px-6 md:px-12 flex flex-col items-center pointer-events-none">
          {errorMessage && (
            <div className="max-w-xl w-full p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-200 text-[11px] font-black uppercase tracking-widest flex items-center space-x-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in slide-in-from-top-10 pointer-events-auto">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500/50 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
          )}
        </div>

        {/* Central Assistant Stage */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 w-full z-10 p-4">
          {hasApiKey === false ? (
            <div className="max-w-md w-full p-10 bg-cyan-950/20 border border-cyan-500/20 rounded-[3rem] backdrop-blur-3xl text-center space-y-8 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto border border-cyan-500/20">
                <Lock className="w-10 h-10 text-cyan-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black google-font tracking-tight text-white uppercase">Authentication Required</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">Initialize your secure synaptic link by selecting a high-bandwidth Gemini API key.</p>
              </div>
              <button 
                onClick={handleOpenApiKeyDialog} 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Engage Security Core
              </button>
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Supports Paid GCP Projects Only</p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center group">
              <div className={`transform transition-all duration-1000 ease-out ${isInteractionDisabled ? 'scale-90 opacity-40 blur-sm' : 'scale-110 md:scale-150'}`}>
                <AssistantOrb status={status} />
              </div>
              
              {status === AssistantStatus.IDLE && !isInteractionDisabled && (
                <button 
                  onClick={startAssistant}
                  className="mt-16 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-2xl px-12 py-5 rounded-full flex items-center space-x-5 group/btn active:scale-95 transition-all shadow-2xl hover:shadow-cyan-500/10 animate-bounce"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400/50 rounded-full blur-[10px] animate-ping"></div>
                    <Mic className="w-5 h-5 text-cyan-400 relative z-10" />
                  </div>
                  <span className="text-[12px] font-black text-white tracking-[0.6em] uppercase">Connect Command</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Terminal / Log Strip */}
        <div className="w-full max-w-4xl px-6 md:px-12 pb-10 mt-auto z-20 shrink-0">
          <div className="h-[280px] glass rounded-[3.5rem] p-8 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.6)] border-white/10 ring-1 ring-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] group-hover:opacity-[0.05] transition-opacity"></div>
            <NotificationPanel notifications={notifications} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
