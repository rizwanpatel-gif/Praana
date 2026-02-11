import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Alert } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: any;

  alerts = signal<Alert[]>([]);
  connected = signal(false);

  constructor(private auth: AuthService) {}

  connect() {
    const token = this.auth.getToken();
    if (!token) return;

    this.ws = new WebSocket(`${environment.wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      this.connected.set(true);
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const alert: Alert = JSON.parse(event.data);
      this.alerts.update(alerts => [alert, ...alerts]);
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.connected.set(false);
  }

  clearAlert(id: string) {
    this.alerts.update(alerts => alerts.filter(a => a.id !== id));
  }
}
