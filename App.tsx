
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';
import { ShieldAlert, Cpu, Wifi, Battery, MicOff } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.IDLE);
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
      content: 'All systems operational. I am ready to assist you.',
      timestamp: new Date(),
      type: 'alert'
    }
  ]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopAssistant();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initAudio = async () => {
    // Basic check for mobile context (HTTPS requirement)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is only available on secure connections (HTTPS). Please check your browser's security settings.");
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Critical for mobile: resume context on user gesture
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state === 'suspended') {
      await outputAudioContextRef.current.resume();
    }

    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (err) {
        throw new Error("Permission Denied: King requires microphone access to hear your instructions.");
      }
    }
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
        case 'get_weather_update':
          result = "Sky is clear, currently 24°C.";
          break;
      }

      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((session) => {
          session.sendToolResponse({
            functionResponses: {
              id: fc.id,
              name: fc.name,
              response: { result },
            }
          });
        });
      }
    }
  };

  const startAssistant = async () => {
    setErrorMessage(null);
    setStatus(AssistantStatus.THINKING);
    try {
      await initAudio();
      
      // Using process.env.API_KEY as per core instructions
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
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            
            if (parts && parts.length > 0) {
              const part = parts[0];
              const base64Audio = part.inlineData?.data;

              if (base64Audio) {
                setStatus(AssistantStatus.SPEAKING);
                const outputCtx = outputAudioContextRef.current;
                if (outputCtx) {
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputCtx.destination);
                  source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setStatus(AssistantStatus.LISTENING);
                  });
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                }
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
            console.error('King API Error:', e);
            setStatus(AssistantStatus.ERROR);
            setErrorMessage("Connection dropped. Please check your internet.");
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
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error('Activation Failed:', err);
      setStatus(AssistantStatus.ERROR);
      setErrorMessage(err.message || "Activation Failed.");
    }
  };

  const stopAssistant = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative no-select">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-1000 ${isSessionActive ? 'bg-blue-900/30' : 'bg-slate-900/20'}`}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar/Drawer for Mobile */}
      <aside className="z-10 w-full md:w-80 shrink-0 p-4 md:p-6 flex flex-col space-y-4 bg-slate-950/40 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between md:justify-start md:space-x-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold google-font leading-tight tracking-tight">KING AI</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">OS v4.2.0</p>
            </div>
          </div>
          <div className="md:hidden flex space-x-2">
            <Battery className="w-4 h-4 text-slate-500" />
            <Wifi className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        <div className="hidden md:flex flex-1 overflow-y-auto scrollbar-hide flex-col space-y-6">
          <DeviceDashboard state={deviceState} />
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnostics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/20 text-center border border-white/5">
                <div className="text-[9px] text-slate-500 mb-1 uppercase font-black">Latency</div>
                <div className="text-sm font-bold text-blue-400">24ms</div>
              </div>
              <div className="p-3 rounded-xl bg-black/20 text-center border border-white/5">
                <div className="text-[9px] text-slate-500 mb-1 uppercase font-black">Uptime</div>
                <div className="text-sm font-bold text-green-400">99.9%</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          disabled={status === AssistantStatus.THINKING}
          className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-500 shadow-2xl active:scale-95 touch-manipulation flex items-center justify-center space-x-2 ${
            isSessionActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
              : 'bg-blue-600 text-white shadow-blue-600/30'
          } ${status === AssistantStatus.THINKING ? 'opacity-50 grayscale' : ''}`}
        >
          {status === AssistantStatus.THINKING ? (
             <span className="flex items-center space-x-2">
               <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span>Syncing...</span>
             </span>
          ) : isSessionActive ? 'Disconnect' : 'Initialize King'}
        </button>
      </aside>

      {/* Main Content */}
      <main className="z-10 flex-1 flex flex-col relative p-4 md:p-6 overflow-hidden">
        <header className="flex justify-between items-center mb-4 md:mb-8 px-2">
          <div className="text-[10px] md:text-xs font-black tracking-tight text-slate-500 uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
             <span className="text-[10px] font-bold text-slate-400">
               {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-auto mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs font-bold text-center flex items-center space-x-3 shadow-lg shadow-red-900/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          {status === AssistantStatus.ERROR && !errorMessage ? (
            <div className="flex flex-col items-center text-slate-500 space-y-4">
              <MicOff className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold">System Restricted</p>
            </div>
          ) : (
            <AssistantOrb status={status} />
          )}
        </div>

        <div className="max-w-xl mx-auto w-full mt-auto mb-2 md:mb-4 max-h-[40vh] md:max-h-none flex flex-col">
          <NotificationPanel notifications={notifications} />
        </div>
      </main>
    </div>
  );
};

export default App;
