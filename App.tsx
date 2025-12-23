
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AssistantStatus, DeviceState, Notification, Alarm } from './types';
import { SYSTEM_INSTRUCTION, DEVICE_TOOLS } from './constants';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import AssistantOrb from './components/AssistantOrb';
import DeviceDashboard from './components/DeviceDashboard';
import NotificationPanel from './components/NotificationPanel';

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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      sender: 'Manager',
      content: 'The board meeting has been moved to 3 PM. Can you confirm your attendance?',
      timestamp: new Date(),
      type: 'message'
    },
    {
      id: '2',
      sender: 'Smart Home',
      content: 'Air conditioning set to 22°C. Welcome home.',
      timestamp: new Date(Date.now() - 3600000),
      type: 'alert'
    }
  ]);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Audio Contexts & Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (outputAudioContextRef.current!.state === 'suspended') {
      await outputAudioContextRef.current!.resume();
    }
  };

  const handleToolCall = (toolCall: any) => {
    for (const fc of toolCall.functionCalls) {
      console.log('Executing Tool:', fc.name, fc.args);
      let result = "ok";
      
      switch (fc.name) {
        case 'toggle_device_setting':
          setDeviceState(prev => ({ ...prev, [fc.args.setting]: fc.args.value }));
          break;
        case 'set_device_value':
          setDeviceState(prev => ({ ...prev, [fc.args.setting]: fc.args.value }));
          break;
        case 'set_alarm':
          result = `Alarm confirmed for ${fc.args.time}. I have added it to your schedule.`;
          break;
        case 'get_weather_update':
          result = "The current temperature is 22°C with clear skies. Perfect for a walk.";
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
    try {
      await initAudio();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            setStatus(AssistantStatus.LISTENING);

            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus(AssistantStatus.SPEAKING);
              const outputCtx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                24000,
                1
              );
              
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

            if (message.toolCall) handleToolCall(message.toolCall);

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus(AssistantStatus.LISTENING);
            }
          },
          onerror: (e) => {
            console.error('King Error:', e);
            setStatus(AssistantStatus.ERROR);
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
    } catch (err) {
      console.error('Startup Failed:', err);
      setStatus(AssistantStatus.ERROR);
    }
  };

  const stopAssistant = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="z-10 w-full md:w-80 p-6 flex flex-col space-y-6 bg-slate-900/40 backdrop-blur-2xl border-r border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <span className="text-2xl font-black text-white">K</span>
          </div>
          <div>
            <h1 className="text-lg font-bold google-font leading-tight">KING AI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise OS</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6">
          <DeviceDashboard state={deviceState} />
          
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Device Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-black/20 text-center">
                <div className="text-xs text-slate-500 mb-1 uppercase font-bold">Battery</div>
                <div className="text-lg font-bold text-green-400">88%</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/20 text-center">
                <div className="text-xs text-slate-500 mb-1 uppercase font-bold">Network</div>
                <div className="text-lg font-bold text-blue-400">5G</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={isSessionActive ? stopAssistant : startAssistant}
          className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-500 shadow-2xl ${
            isSessionActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {isSessionActive ? 'Shut Down' : 'Initialize King'}
        </button>
      </aside>

      {/* Main Experience */}
      <main className="z-10 flex-1 flex flex-col relative p-6">
        <header className="flex justify-between items-center mb-8 px-4 opacity-60">
          <div className="text-xs font-black tracking-tighter">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex space-x-4">
             <span className="text-xs font-bold">LTE</span>
             <span className="text-xs font-bold">12:45 PM</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <AssistantOrb status={status} />
        </div>

        <div className="max-w-xl mx-auto w-full mt-auto mb-4">
          <NotificationPanel notifications={notifications} />
        </div>
      </main>
    </div>
  );
};

export default App;
