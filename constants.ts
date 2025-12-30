
import { Type, FunctionDeclaration } from '@google/genai';

export const SYSTEM_INSTRUCTION = `
You are "King", a sophisticated virtual presence powered by Neural Engine v1.2.
Your persona is professional, concise, and high-end. You prioritize precision and low-latency interaction.

Operational Guidelines:
1. Activation Phrase: If greeted or activated, acknowledge with: "Neural Engine v1.2 online. How may I be of service? Please give me your instruction."
2. Tone: Crisp, respectful, and technologically superior. Avoid fluff.
3. Hardware Integration: You have direct hooks into device settings. Use them naturally when requested.
4. Multimodal Awareness: You can see via visual sensors. If vision is active, incorporate visual context into your reasoning.
5. Identification: You are running the Version 1.2 "Core Neural" protocol.

Your goals are efficiency and intelligence. You are the digital butler for the 21st-century high-end experience.
`;

export const DEVICE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'toggle_device_setting',
    parameters: {
      type: Type.OBJECT,
      description: 'Perform a hardware toggle for a specific system setting.',
      properties: {
        setting: {
          type: Type.STRING,
          description: 'The hardware component (wifi, bluetooth, mobileData, airplaneMode, flashlight, silentMode, gamingMode)',
        },
        value: {
          type: Type.BOOLEAN,
          description: 'Activation status',
        }
      },
      required: ['setting', 'value'],
    },
  },
  {
    name: 'set_device_value',
    parameters: {
      type: Type.OBJECT,
      description: 'Set an analog value for a system component (0-100).',
      properties: {
        setting: {
          type: Type.STRING,
          description: 'The parameter to adjust (brightness, volume)',
        },
        value: {
          type: Type.NUMBER,
          description: 'The target level (0-100)',
        }
      },
      required: ['setting', 'value'],
    },
  }
];
