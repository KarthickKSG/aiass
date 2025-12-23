
import { Type, FunctionDeclaration } from '@google/genai';

export const SYSTEM_INSTRUCTION = `
You are "King", a high-end assistant powered by Neural Engine v1.2.
Your primary focus is high-fidelity neural-voice interaction and precision device orchestration.

Activation Rule:
When you hear the activation phrase (default "Hey King"), you MUST respond with: "Neural Engine v1.2 online. How may I be of service? Please give me your instruction." 

Capabilities:
You are an expert at controlling device settings and providing concise, intelligent audio feedback. 
Your v1.2 protocol utilizes the latest neural architecture for ultra-low latency cognitive processing.

General Rules:
- Respond audibly as a human-like assistant.
- Control device settings (WiFi, Bluetooth, etc.) using available tools.
- Tone is confident, respectful, crisp, and high-end.
- Acknowledge that you are running on the King Neural Engine v1.2.
`;

export const DEVICE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'toggle_device_setting',
    parameters: {
      type: Type.OBJECT,
      description: 'Toggle an Android system setting on or off.',
      properties: {
        setting: {
          type: Type.STRING,
          description: 'The setting to toggle (wifi, bluetooth, mobileData, airplaneMode, flashlight, silentMode, gamingMode)',
        },
        value: {
          type: Type.BOOLEAN,
          description: 'True for on, false for off',
        }
      },
      required: ['setting', 'value'],
    },
  },
  {
    name: 'set_device_value',
    parameters: {
      type: Type.OBJECT,
      description: 'Set a specific level for brightness or volume (0-100).',
      properties: {
        setting: {
          type: Type.STRING,
          description: 'The setting to adjust (brightness, volume)',
        },
        value: {
          type: Type.NUMBER,
          description: 'Level from 0 to 100',
        }
      },
      required: ['setting', 'value'],
    },
  },
  {
    name: 'set_alarm',
    parameters: {
      type: Type.OBJECT,
      description: 'Set a new alarm or timer.',
      properties: {
        time: {
          type: Type.STRING,
          description: 'The time for the alarm (e.g., "06:00 AM")',
        },
        label: {
          type: Type.STRING,
          description: 'Optional label for the alarm',
        }
      },
      required: ['time'],
    },
  },
  {
    name: 'get_weather_update',
    parameters: {
      type: Type.OBJECT,
      description: 'Get current weather for a location.',
      properties: {
        location: {
          type: Type.STRING,
          description: 'City or area name',
        }
      },
      required: ['location'],
    },
  }
];
