export interface SimulatedMessage {
  id: string
  title: string
  message: string
  metadata: Record<string, any>
  timestamp: string
  status: 'queued' | 'broker_delivering' | 'processing' | 'acked' | 'nacked' | 'dead_letter'
  retryCount: number
}

export interface SimulationLog {
  id: string
  timestamp: string
  service: 'Producer' | 'Broker' | 'Consumer' | 'Notification' | 'System'
  type: 'info' | 'success' | 'warn' | 'error'
  text: string
}

export interface ConsumerSettings {
  autoAck: boolean
  simulateError: boolean
  processingDelayMs: number
}

export interface TelegramConfig {
  token: string
  chatId: string
}

export interface Subscriber {
  id: string
  name: string
  status?: string
}
