
export enum AssistantMode {
  EFFICIENCY = 'EFFICIENCY',
  CREATIVE = 'CREATIVE',
  PRECISION = 'PRECISION'
}

export interface DeviceState {
  wifi: boolean;
  bluetooth: boolean;
  mobileData: boolean;
  airplaneMode: boolean;
  flashlight: boolean;
  silentMode: boolean;
  gamingMode: boolean;
  brightness: number;
  volume: number;
}

export interface Notification {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'alert' | 'schedule';
}

export enum AssistantStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}
