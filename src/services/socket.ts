import { SocketMessage } from "../types";

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: ((msg: SocketMessage) => void)[] = [];

  connect(userId: string, name: string, role: string, lat: number, lng: number) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${window.location.host}`);

    this.socket.onopen = () => {
      this.send({
        type: 'auth',
        userId,
        name,
        role,
        lat,
        lng
      });
    };

    this.socket.onmessage = (event) => {
      const msg: SocketMessage = JSON.parse(event.data);
      this.listeners.forEach(l => l(msg));
    };
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  updateLocation(lat: number, lng: number, role: string) {
    this.send({ type: 'update_location', lat, lng, role });
  }

  addListener(callback: (msg: SocketMessage) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (msg: SocketMessage) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }
}

export const socketService = new SocketService();
