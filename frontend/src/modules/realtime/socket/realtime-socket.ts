import type { ConnectionStatus, RealtimeEvent } from '../interface/realtime-event.interface';
import { env } from '@/environment/env';

const TOKEN_EXPIRED_CODE = 4001;
const USER_DEACTIVATED_CODE = 4003;
const NORMAL_CLOSE_CODE = 1000;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

interface RealtimeSocketOptions {
  getAccessToken: () => string | null;
  isAccessTokenExpired: () => boolean;
  refresh: () => Promise<void>;
  onEvent: (event: RealtimeEvent) => void;
  onStatus: (status: ConnectionStatus) => void;
  onReconnect: () => void;
  onDeactivated: () => void;
}

export class RealtimeSocket {
  private socket: WebSocket | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private stopped = true;
  private hasConnected = false;

  constructor(private readonly options: RealtimeSocketOptions) {}

  start() {
    this.stopped = false;
    document.addEventListener('visibilitychange', this.resume);
    window.addEventListener('online', this.resume);
    this.connect();
  }

  stop() {
    this.stopped = true;
    document.removeEventListener('visibilitychange', this.resume);
    window.removeEventListener('online', this.resume);
    clearTimeout(this.timer);
    this.socket?.close(NORMAL_CLOSE_CODE);
    this.socket = null;
    this.options.onStatus('idle');
  }

  private resume = () => {
    if (this.stopped || document.visibilityState !== 'visible') return;
    const state = this.socket?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    clearTimeout(this.timer);
    this.attempt = 0;
    this.reconnectNow();
  };

  private connect() {
    const token = this.options.getAccessToken();
    if (this.stopped || !token) return;

    this.options.onStatus('connecting');
    const socket = new WebSocket(`${env.NEXT_PUBLIC_WS_URL}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.options.onStatus('open');
      if (this.hasConnected) this.options.onReconnect();
      this.hasConnected = true;
    };

    socket.onmessage = (message) => {
      const event = this.parse(message.data);
      if (event) this.options.onEvent(event);
    };

    socket.onclose = ({ code }) => {
      if (this.stopped || this.socket !== socket) return;
      if (code === USER_DEACTIVATED_CODE) {
        this.stop();
        this.options.onDeactivated();
        return;
      }
      this.options.onStatus('closed');
      this.reconnect(code);
    };
  }

  private reconnectNow() {
    if (!this.options.isAccessTokenExpired()) {
      this.connect();
      return;
    }

    this.options.refresh().then(
      () => this.connect(),
      () => undefined,
    );
  }

  private reconnect(code: number) {
    if (code === TOKEN_EXPIRED_CODE || this.options.isAccessTokenExpired()) {
      this.reconnectNow();
      return;
    }

    const delay = Math.min(INITIAL_DELAY_MS * 2 ** this.attempt, MAX_DELAY_MS);
    this.attempt += 1;
    this.timer = setTimeout(() => this.connect(), delay);
  }

  private parse(data: unknown): RealtimeEvent | null {
    if (typeof data !== 'string') return null;
    try {
      const event = JSON.parse(data);
      return typeof event?.type === 'string' && event.data ? event : null;
    } catch {
      return null;
    }
  }
}
