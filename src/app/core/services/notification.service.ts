import { Injectable, OnDestroy } from '@angular/core';
import { WebPubSubClient } from '@azure/web-pubsub-client';
import { BehaviorSubject, Observable } from 'rxjs'; // Import BehaviorSubject and Observable
import { environment } from '../../../environments/environment';

export interface NotificationEvent {
  eventId: string;
  category: string;
  type: string;
  severity: string;
  targetGroup: string;
  timestamp: string;
  content: {
    title: string;
    description: string;
    actionUrl?: string;
    metadata?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private client: WebPubSubClient | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);

  public isConnected$ = this.isConnectedSubject.asObservable();

  // Expose notifications as an Observable
  private notificationSubject = new BehaviorSubject<NotificationEvent | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const negotiateUrl = `${environment.functionsUrl}/negotiate`;

      this.client = new WebPubSubClient(negotiateUrl);

      this.client.on('connected', (e: any) => {
        console.log('Web PubSub connected', e);
        this.isConnectedSubject.next(true);
      });

      this.client.on('disconnected', (e: any) => {
        console.log('Web PubSub disconnected', e);
        this.isConnectedSubject.next(false);
      });

      this.client.on('server-message', (e: any) => {
        console.log('Received message:', e.message.data);
        if (e.message.data) {
          try {
            // Assuming data is JSON
            const notification = e.message.data as NotificationEvent;
            this.handleNotification(notification);
          } catch (err) {
            console.error('Error parsing notification:', err);
          }
        }
      });

      await this.client.start();
      console.log('Web PubSub client started');

    } catch (error) {
      console.error('Failed to connect to Web PubSub:', error);
    }
  }

  private handleNotification(notification: NotificationEvent) {
    this.notificationSubject.next(notification);

    // Here you can also trigger global toasts/alerts
    // toastr.info(notification.content.description, notification.content.title);
    if (notification.severity === 'CRITICAL' || notification.severity === 'ERROR') {
      console.error(`[${notification.category}] ${notification.content.title}: ${notification.content.description}`);
    } else {
      console.log(`[${notification.category}] ${notification.content.title}: ${notification.content.description}`);
    }
  }

  async stop() {
    if (this.client) {
      await this.client.stop();
      this.isConnectedSubject.next(false);
    }
  }

  ngOnDestroy() {
    this.stop();
  }
}
