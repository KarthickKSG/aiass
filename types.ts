
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

export interface Alarm {
  id: string;
  time: string;
  label: string;
  active: boolean;
}

export interface AppSettings {
  activationPhrase: string;
  userName: string;
  theme: 'dark' | 'light';
}

export enum AssistantStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}
