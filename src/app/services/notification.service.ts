import { Injectable } from '@angular/core';
import { Observable, Subject, of, delay } from 'rxjs';
import { Notification, NotificationType } from '../models/notification.model';


let MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Bienvenue",
    message: "Votre compte vient d'être créé.",
    type: NotificationType.UTILISATEUR,
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Nouvelle tâche",
    message: "Vous êtes assigné à la tâche: REST API.",
    type: NotificationType.TACHE,
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  
  private readonly _realtime$ = new Subject<Notification>();
  readonly realtime$ = this._realtime$.asObservable();

  constructor() {}

  

  
  connect(userId: number): void {
    
    setTimeout(() => {
      const notif: Notification = {
        id: MOCK_NOTIFICATIONS.length + 1,
        title: "Nouveau message",
        message: "Vous avez un nouveau message sur le projet.",
        type: NotificationType.MESSAGE,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      MOCK_NOTIFICATIONS.push(notif);
      this._realtime$.next(notif);
    }, 5000);
  }

  
  disconnect(): void {
    
  }

  

  
  list(userId: number): Observable<Notification[]> {
    
    return of(MOCK_NOTIFICATIONS).pipe(delay(200));
  }

  
  latest(userId: number): Observable<Notification[]> {
    const latest = MOCK_NOTIFICATIONS.slice(-5);
    return of(latest).pipe(delay(200));
  }

  
  markAsRead(id: number): Observable<Notification> {
    const notif = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (notif) notif.isRead = true;
    return of(notif!).pipe(delay(200));
  }

  
  delete(id: number): Observable<void> {
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.filter(n => n.id !== id);
    return of(void 0).pipe(delay(200));
  }
}
