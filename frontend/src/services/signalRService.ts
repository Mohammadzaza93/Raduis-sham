import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: ((notification: any) => void)[] = [];

  async startConnection(token: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/notificationHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (notification) => {
      this.listeners.forEach(listener => listener(notification));
    });

    await this.connection.start();
    console.log('SignalR connected');
  }

  onNotification(callback: (notification: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async sendNotification(userId: string, title: string, message: string, type: string) {
    await this.connection?.invoke('SendNotification', userId, title, message, type);
  }

  stopConnection() {
    this.connection?.stop();
  }
}

export const signalRService = new SignalRService();