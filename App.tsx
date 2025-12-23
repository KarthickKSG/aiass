import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification, AssistantMode } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { 
  ShieldAlert, Cpu, Key, ExternalLink, Settings, Save, CheckCircle2, 
  Trash2, Lock, Camera, Zap, Terminal, BrainCircuit, Activity, BarChart3
} from 'lucide-react';

const FRAME_RATE = 1;
const JPEG_QUALITY = 0.5;

const App: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.IDLE);
  const [mode, setMode] = useState<AssistantMode>(AssistantMode.PRECISION);
  const [showSettings, setShowSettings] = useState(false);
  
  const [editingKey, setEditingKey] = useState<string>(localStorage.getItem('king_api_key') || '');
  const [isKeyApplied, setIsKeyApplied] = useState<boolean>(!!localStorage.getItem('king_api_key'));
  
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
    return () => {
      stopAssistant();
      stopVision();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

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
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      setErrorMessage("Vision module handshake failed.");
    }
  };

  const stopVision = () => {
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
    if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach(t => t.stop());
    setIsVisionActive(false);
  };

  const startAssistant = async () => {
    setErrorMessage(null);
    const activeKey = localStorage.getItem('king_api_key') || process.env.API_KEY;

    if (!activeKey && window.aistudio) {
      if (!await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }
    }

    setStatus(AssistantStatus.THINKING);
    try {
      await initAudio();
      const ai = new GoogleGenAI({ apiKey: activeKey });
      
      const config: any = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_INSTRUCTION + `\nCurrently in ${mode} mode. Adjust complexity accordingly.`,
        tools: [{ functionDeclarations: DEVICE_TOOLS }],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      };

      if (mode === AssistantMode.PRECISION) {
        config.thinkingConfig = { thinkingBudget: 16000 };
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
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let res = "ok";
                if (fc.name === 'toggle_device_setting') setDeviceState(p => ({ ...p, [fc.args.setting]: fc.args.value }));
                if (fc.name === 'set_device_value') setDeviceState(p => ({ ...p, [fc.args.setting]: fc.args.value }));
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: res } } }));
              }
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: () => setErrorMessage("Synaptic drift detected. Reconnecting..."),
          onclose: () => { setIsSessionActive(false); setStatus(AssistantStatus.IDLE); }
        },
        config
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      setStatus(AssistantStatus.ERROR);
    }
  };

  const stopAssistant = () => {
    sessionPromiseRef.current?.then(s => s.close());
    sessionPromiseRef.current = null;
    stopVision();
  };

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select">
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black google-font tracking-tight flex items-center">
                <BrainCircuit className="w-5 h-5 mr-3 text-cyan-400" />
                Kernel Config
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <ShieldAlert className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cognitive Protocol</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AssistantMode).map(m => (
                    <button 
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${mode === m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex justify-between">
                  Neural Key Link
                  {isKeyApplied && <span className="text-green-400 flex items-center"><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Active</span>}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"><Lock className="w-4 h-4" /></div>
                  <input 
                    type="password" value={editingKey}
                    onChange={(e) => { setEditingKey(e.target.value); if (isKeyApplied) setIsKeyApplied(false); }}
                    placeholder="Cipher Key..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-14 py-4 text-xs font-medium focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-800"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isKeyApplied ? (
                      <button onClick={() => { localStorage.removeItem('king_api_key'); setEditingKey(''); setIsKeyApplied(false); }} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => { localStorage.setItem('king_api_key', editingKey); setIsKeyApplied(true); }} className="p-2.5 text-cyan-400 hover:bg-cyan-400/10 rounded-xl"><Save className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Neural Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <div className={`absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent transition-all duration-1000 ${isSessionActive ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      <aside className="z-20 w-full md:w-80 shrink-0 p-5 md:p-6 flex flex-col space-y-6 glass border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center shadow-lg shadow-cyan-500/20 p-0.5 border border-white/10">
              <img src="Logo.png" alt="King AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black google-font tracking-tighter">KING AI</h1>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Neural Core v8.0</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={isVisionActive ? stopVision : startVision} className={`p-2.5 rounded-xl border transition-all ${isVisionActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-cyan-500/20 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}><Camera className="w-4 h-4" /></button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-slate-500 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 overflow-y-auto scrollbar-hide flex-col space-y-6">
          {isVisionActive && (
            <div className="relative aspect-[4/3] bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none border border-cyan-400/20 rounded-[2rem]"></div>
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-400/30 animate-scan"></div>
              
              {/* Vision HUD Elements */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                 <div className="w-32 h-32 border-[0.5px] border-cyan-400/30 rounded-full"></div>
                 <div className="absolute top-1/2 left-0 right-0 h-[0.5px] bg-cyan-400/10"></div>
                 <div className="absolute left-1/2 top-0 bottom-0 w-[0.5px] bg-cyan-400/10"></div>
              </div>

              <div className="absolute bottom-4 left-4 flex items-center space-x-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Vision-Link Active</span>
              </div>
            </div>
          )}

          <div className="glass rounded-[2rem] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><BarChart3 className="w-3 h-3 mr-2" /> Neural Load</span>
              <span className="text-[10px] font-black text-cyan-400 uppercase">Optimized</span>
            </div>
            <div className="flex space-x-1.5 h-8 items-end">
              {[40, 70, 45, 90, 65, 80, 50, 85, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-sm animate-pulse" style={{ height: `${isSessionActive ? h : 20}%`, transition: 'height 0.5s ease' }}></div>
              ))}
            </div>
          </div>

          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={status === AssistantStatus.THINKING}
          className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] tracking-[0.4em] uppercase transition-all duration-700 shadow-2xl active:scale-[0.98] ${
            isSessionActive ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-cyan-600/30 hover:scale-[1.02]'
          }`}
        >
          {isSessionActive ? 'Disconnect Core' : 'Initialize King'}
        </button>
      </aside>

      <main className="z-10 flex-1 flex flex-col relative p-5 md:p-8 overflow-hidden">
        <header className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase mb-1">Status Protocol</span>
            <div className="flex items-center space-x-3">
              <div className={`px-4 py-1.5 glass rounded-full flex items-center space-x-2 border-white/5`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`}></div>
                 <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">
                   {isSessionActive ? `${mode} LINK ACTIVE` : 'CORE STANDBY'}
                 </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-4 items-center">
             <div className="text-right hidden sm:block">
               <div className="text-[11px] font-black text-slate-200 uppercase tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
               <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">GMT Sync Ready</div>
             </div>
             <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border-white/5">
                <Terminal className="w-4 h-4 text-slate-500" />
             </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-200 text-[10px] font-black uppercase tracking-widest flex items-center space-x-4 shadow-2xl animate-in slide-in-from-top-4">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <AssistantOrb status={status} />
        </div>

        <div className="max-w-xl mx-auto w-full mt-auto h-[240px] glass rounded-[2.5rem] p-6 shadow-2xl border-white/5">
          <NotificationPanel notifications={notifications} />
        </div>
      </main>
    </div>
  );
};

export default App;