
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { ShieldAlert, Cpu, Wifi, Battery, MicOff, Eye, EyeOff, Key, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.IDLE);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
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
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      sender: 'King System',
      content: 'Core architecture ready. Vision modules initialized.',
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
      setHasKey(selected);
    } else {
      // Fallback for environments where process.env is the only way
      setHasKey(!!process.env.API_KEY);
    }
  };

  const handleLinkKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Proceeding as per instructions (assume success after trigger)
    }
  };

  const initAudio = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Secure connection (HTTPS) required for hardware access.");
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
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64Data = (reader.result as string).split(',')[1];
                  sessionPromiseRef.current?.then(session => {
                    session.sendRealtimeInput({
                      media: { data: base64Data, mimeType: 'image/jpeg' }
                    });
                  });
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', 0.6);
          }
        }
      }, 1000);
    } catch (err) {
      setErrorMessage("Vision restricted by hardware or user.");
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
    setStatus(AssistantStatus.THINKING);
    try {
      await initAudio();
      // Always create a new instance right before use to ensure latest API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
              setHasKey(false);
              setErrorMessage("Project API key not found. Please re-link.");
            } else {
              setErrorMessage("Sync connection failed.");
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
      setErrorMessage("Boot error: Check permissions.");
    }
  };

  const stopAssistant = () => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    stopVision();
  };

  if (hasKey === false) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8">
          <Key className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black google-font tracking-tight mb-2">SYSTEM LINK REQUIRED</h1>
        <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
          To initialize King AI, you must link a valid API key from a paid GCP project.
        </p>
        <button 
          onClick={handleLinkKey}
          className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all mb-4"
        >
          Select Project Key
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-slate-500 flex items-center space-x-1 uppercase tracking-widest hover:text-blue-400"
        >
          <span>Billing Documentation</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-1000 ${isSessionActive ? 'bg-blue-900/30' : 'bg-slate-900/10'}`}></div>
      </div>

      <aside className="z-20 w-full md:w-80 shrink-0 p-4 md:p-6 flex flex-col space-y-4 bg-slate-950/60 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold google-font leading-tight">KING AI</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Vision Module v1.2</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={isVisionActive ? stopVision : startVision}
              className={`p-2 rounded-lg border transition-all ${isVisionActive ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
              title="Toggle Vision"
            >
              {isVisionActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 overflow-y-auto scrollbar-hide flex-col space-y-4">
          {isVisionActive && (
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <div className="absolute top-2 left-2 flex items-center space-x-1 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Live Feed</span>
              </div>
            </div>
          )}
          <DeviceDashboard state={deviceState} />
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={status === AssistantStatus.THINKING}
          className={`w-full py-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-500 shadow-2xl ${
            isSessionActive ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white shadow-blue-600/20'
          }`}
        >
          {isSessionActive ? 'End Session' : 'Wake King'}
        </button>
      </aside>

      <main className="z-10 flex-1 flex flex-col relative p-4 md:p-6 overflow-hidden">
        {isVisionActive && (
          <div className="md:hidden absolute top-4 right-4 w-28 aspect-video rounded-xl overflow-hidden border border-white/10 z-30 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        <header className="flex justify-between items-center mb-8">
          <div className="text-[10px] font-black tracking-tight text-slate-500 uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
             <span className="text-[10px] font-bold text-slate-400">ENCRYPTED LINK</span>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-auto mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs font-bold flex items-center space-x-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <AssistantOrb status={status} />
        </div>

        <div className="max-w-xl mx-auto w-full mt-auto flex flex-col">
          <NotificationPanel notifications={notifications} />
        </div>
      </main>
    </div>
  );
};

export default App;
