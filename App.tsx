
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { ShieldAlert, Cpu, Wifi, Battery, MicOff, Eye, EyeOff, Key, ExternalLink, Settings, Save, CheckCircle2, Trash2, Lock, Camera } from 'lucide-react';

const FRAME_RATE = 1; // Frames per second
const JPEG_QUALITY = 0.5;

const App: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.IDLE);
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
    brightness: 80,
    volume: 50,
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      sender: 'King System',
      content: 'Core architecture ready. Vision and Voice modules operational.',
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

  const handleLinkKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowSettings(false);
    }
  };

  const handleSaveKey = () => {
    if (editingKey.trim()) {
      localStorage.setItem('king_api_key', editingKey.trim());
      setIsKeyApplied(true);
      addNotification('System', 'Manual API key secured.', 'alert');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('king_api_key');
    setEditingKey('');
    setIsKeyApplied(false);
    addNotification('System', 'Manual key removed.', 'alert');
  };

  const addNotification = (sender: string, content: string, type: 'message' | 'alert' | 'schedule') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date(),
      type
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const initAudio = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Secure connection required for audio hardware.");
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    if (outputAudioContextRef.current?.state === 'suspended') await outputAudioContextRef.current.resume();

    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
    }
  };

  const startVision = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVisionActive(true);
      
      visionIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionPromiseRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasRef.current.toBlob(async (blob) => {
              if (blob && sessionPromiseRef.current) {
                const base64Data = await blobToBase64(blob);
                sessionPromiseRef.current?.then(session => {
                  session.sendRealtimeInput({
                    media: { data: base64Data, mimeType: 'image/jpeg' }
                  });
                });
              }
            }, 'image/jpeg', JPEG_QUALITY);
          }
        }
      }, 1000 / FRAME_RATE);
    } catch (err) {
      setErrorMessage("Vision restricted by hardware or permissions.");
    }
  };

  const stopVision = () => {
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsVisionActive(false);
  };

  const handleToolCall = (toolCall: any) => {
    if (!toolCall.functionCalls) return;
    for (const fc of toolCall.functionCalls) {
      let result = "ok";
      switch (fc.name) {
        case 'toggle_device_setting':
          setDeviceState(prev => ({ ...prev, [fc.args.setting]: fc.args.value }));
          break;
        case 'set_device_value':
          setDeviceState(prev => ({ ...prev, [fc.args.setting]: fc.args.value }));
          break;
        case 'set_alarm':
          result = `Alarm set for ${fc.args.time}.`;
          addNotification('King', result, 'schedule');
          break;
      }
      sessionPromiseRef.current?.then(session => {
        session.sendToolResponse({
          functionResponses: { id: fc.id, name: fc.name, response: { result } }
        });
      });
    }
  };

  const startAssistant = async () => {
    setErrorMessage(null);
    const activeKey = localStorage.getItem('king_api_key') || process.env.API_KEY;

    if (!activeKey && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setStatus(AssistantStatus.THINKING);
    try {
      await initAudio();
      
      // Fresh instance for every session to ensure latest key is used
      const ai = new GoogleGenAI({ apiKey: activeKey });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            setStatus(AssistantStatus.LISTENING);
            if (audioContextRef.current && streamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              const base64Audio = parts[0].inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                setStatus(AssistantStatus.SPEAKING);
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus(AssistantStatus.LISTENING);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            }
            if (message.toolCall) handleToolCall(message.toolCall);
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus(AssistantStatus.LISTENING);
            }
          },
          onerror: (e) => {
            setStatus(AssistantStatus.ERROR);
            const msg = (e as any).message || "";
            if (msg.includes("Requested entity was not found")) {
              setErrorMessage("Security mismatch. Please re-link via Settings.");
            } else {
              setErrorMessage("Neural sync failure. Check network integrity.");
            }
          },
          onclose: () => {
            setIsSessionActive(false);
            setStatus(AssistantStatus.IDLE);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: DEVICE_TOOLS }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setStatus(AssistantStatus.ERROR);
      setErrorMessage("Hardware handshake failed. Check permissions.");
    }
  };

  const stopAssistant = () => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    stopVision();
  };

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select">
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black google-font tracking-tight">Kernel Config</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <ShieldAlert className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual API Entry</h3>
                  {isKeyApplied && (
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter flex items-center space-x-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password"
                    value={editingKey}
                    onChange={(e) => {
                      setEditingKey(e.target.value);
                      if (isKeyApplied) setIsKeyApplied(false);
                    }}
                    placeholder="Paste Gemini API Key..."
                    className={`w-full bg-white/5 border ${isKeyApplied ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 focus:border-blue-500/50'} rounded-2xl pl-11 pr-14 py-4 text-sm font-medium focus:outline-none transition-all placeholder:text-slate-700`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    {isKeyApplied ? (
                      <button onClick={handleClearKey} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={handleSaveKey} disabled={!editingKey.trim()} className="p-2.5 text-blue-400 hover:bg-blue-400/10 disabled:opacity-30 rounded-xl transition-colors">
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cloud Integration</h3>
                <button 
                  onClick={handleLinkKey}
                  className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-200">AI Studio Managed Link</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.2em]">Neural Protocol v4.4.0</p>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 px-4 py-1.5 rounded-full bg-white/5 text-[9px] text-slate-400 hover:text-white border border-white/5 font-bold uppercase tracking-widest flex items-center space-x-2 transition-all"
                >
                  <span>Verify Billing Status</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000 ${isSessionActive ? 'bg-blue-900/20' : 'bg-slate-900/10'}`}></div>
      </div>

      <aside className="z-20 w-full md:w-80 shrink-0 p-4 md:p-6 flex flex-col space-y-4 bg-slate-950/60 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden border border-white/10 p-0.5">
              <img 
                src="Logo.png" 
                alt="King AI Logo" 
                className="w-full h-full object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-white"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg></div>';
                  }
                }} 
              />
            </div>
            <div>
              <h1 className="text-lg font-black google-font leading-tight tracking-tighter">KING AI</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Neural Engine v1.2</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={isVisionActive ? stopVision : startVision}
              className={`p-2.5 rounded-xl border transition-all ${isVisionActive ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
              title="Toggle Camera Feed"
            >
              {isVisionActive ? <Camera className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-slate-500 hover:text-white transition-all"
              title="Kernel Config"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 overflow-y-auto scrollbar-hide flex-col space-y-4">
          {isVisionActive && (
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group shadow-2xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live Optic Link</span>
              </div>
            </div>
          )}
          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={status === AssistantStatus.THINKING}
          className={`w-full py-4.5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase transition-all duration-500 shadow-2xl active:scale-95 ${
            isSessionActive ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white shadow-blue-600/30'
          }`}
        >
          {isSessionActive ? 'End Session' : 'Wake King'}
        </button>
      </aside>

      <main className="z-10 flex-1 flex flex-col relative p-4 md:p-6 overflow-hidden">
        {isVisionActive && (
          <div className="md:hidden absolute top-4 right-4 w-28 aspect-video rounded-xl overflow-hidden border border-white/10 z-30 shadow-2xl bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        <header className="flex justify-between items-center mb-8">
          <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 flex items-center space-x-2">
               <div className={`w-1 h-1 rounded-full ${isSessionActive ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
               <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                 {isSessionActive ? 'Synaptic Link Active' : 'Standby Mode'}
               </span>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs font-bold flex items-center space-x-3 shadow-2xl max-w-sm animate-in fade-in slide-in-from-top-4">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <AssistantOrb status={status} />
        </div>

        <div className="max-w-xl mx-auto w-full mt-auto flex flex-col h-[220px]">
          <NotificationPanel notifications={notifications} />
        </div>
      </main>
    </div>
  );
};

export default App;
