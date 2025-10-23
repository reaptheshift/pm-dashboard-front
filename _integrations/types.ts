export interface Integration {
  id: number;
  name: string;
  description: string;
  image: string;
  connected: boolean;
  category?: string;
  provider?: string;
  lastSync?: string;
}

export interface IntegrationStatus {
  total: number;
  connected: number;
  disconnected: number;
}

export interface IntegrationAction {
  type: 'CONNECT' | 'DISCONNECT' | 'SYNC' | 'CONFIGURE';
  integrationId: number;
  payload?: any;
}
