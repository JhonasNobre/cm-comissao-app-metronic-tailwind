import { Injectable, OnDestroy } from '@angular/core';
import { WebPubSubClient } from '@azure/web-pubsub-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
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

  constructor(private messageService: MessageService) {
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

    // Trigger toast using PrimeNG MessageService based on severity
    if (notification.severity === 'CRITICAL' || notification.severity === 'ERROR') {
      this.error(notification.content.title, notification.content.description);
    } else if (notification.severity === 'WARNING') {
      this.warn(notification.content.title, notification.content.description);
    } else {
      this.info(notification.content.title, notification.content.description);
    }
  }

  // --- Toast Methods (Restored & Flexible) ---

  success(arg1: string, arg2?: string) {
    const { title, message } = this.resolveArgs(arg1, arg2, 'Sucesso');
    this.messageService.add({ severity: 'success', summary: title, detail: message });
  }

  error(arg1: string, arg2?: string) {
    const { title, message } = this.resolveArgs(arg1, arg2, 'Erro');
    this.messageService.add({ severity: 'error', summary: title, detail: message });
  }

  info(arg1: string, arg2?: string) {
    const { title, message } = this.resolveArgs(arg1, arg2, 'Informação');
    this.messageService.add({ severity: 'info', summary: title, detail: message });
  }

  warn(arg1: string, arg2?: string) {
    const { title, message } = this.resolveArgs(arg1, arg2, 'Atenção');
    this.messageService.add({ severity: 'warn', summary: title, detail: message });
  }

  private resolveArgs(arg1: string, arg2: string | undefined, defaultTitle: string): { title: string, message: string } {
    if (arg2) {
      // Called as (title, message)
      return { title: arg1, message: arg2 };
    }
    // Called as (message)
    return { title: defaultTitle, message: arg1 };
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
