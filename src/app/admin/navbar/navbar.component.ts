
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import {
  DatePipe,
  NgIf,
  NgForOf,
  NgOptimizedImage,
} from '@angular/common';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

import { Notification }        from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { UserService }         from '../../services/user.service';
import { AuthService }         from '../../services/auth.service';
import { User, UserRole }      from '../../models/user.model';

interface JwtPayload {
  id:   number;
  role: UserRole | string;
  sub:  string;
  iat:  number;
  exp:  number;
}

@Component({
  selector:   'app-navbar',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    NgForOf,
    NgOptimizedImage,
  ],
  templateUrl: './navbar.component.html',
  styleUrls:  ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {

  
  private userId?: number;
  private readonly MAX_VISIBLE_NOTIFICATIONS = 3; 

  
  avatarUrl    = 'assets/profile.png';
  profileName  = '';
  profileRole  = '';

  notifications: Notification[] = [];       
  displayedNotifications: Notification[] = []; 
  unread       = 0;
  openPanel    = false;
  showingAll   = false;
  expandedIds  = new Set<number>();        
  
  
  showProfileMenu = false;
  
  
  showProfileModal = false;
  userDetails: User | null = null;
  
  private subWs?: Subscription;

  constructor(
    private authSvc: AuthService,
    public userSvc: UserService,
    private notifSvc: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    const rawToken = this.authSvc.getToken();
    if (!rawToken) { return; }                 

    const { id, sub, role } = jwtDecode<JwtPayload>(rawToken);
    this.userId      = id;
    this.profileName = sub;
    this.profileRole = role.toString();

    if (!this.userId) { return; }

    
    this.userSvc.getById(this.userId).subscribe({
      next: (u: User) => {
        this.profileName = u.nom ?? this.profileName;
        this.profileRole = u.role ?? this.profileRole;
        
        this.avatarUrl   = this.userSvc.photoUrl(u.photo);
      },
      error: (err) => console.error('Erreur lors de la récupération du profil initial:', err),
    });

    
    this.refreshLatest();

    this.notifSvc.connect(this.userId);
    this.subWs = this.notifSvc.realtime$
      .subscribe(n => {
        this.notifications.unshift(n);
        this.updateDisplayedNotifications();
        if (!n.isRead) { this.unread++; }
      });
      
    
    document.addEventListener('click', this.handleOutsideClick);
  }

  ngOnDestroy(): void {
    this.subWs?.unsubscribe();
    this.notifSvc.disconnect();
    
    
    document.removeEventListener('click', this.handleOutsideClick);
  }

  
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.openPanel = false;
    this.showProfileMenu = false;
    this.showProfileModal = false;
    
    
    if (this.showProfileModal) {
      document.body.style.overflow = 'auto';
    }
  }

  
  toggle(): void {
    this.openPanel = !this.openPanel;
    this.showProfileMenu = false; 
    if (this.openPanel) { this.refreshLatest(); }
  }

  isExpanded(notificationId: number): boolean {
    return this.expandedIds.has(notificationId);
  }

  toggleExpand(n: Notification, event?: Event): void {
    
    event?.stopPropagation();
    
    
    if (!n.isRead) {
      this.markRead(n);
    }
    
    
    if (this.expandedIds.has(n.id)) {
      this.expandedIds.delete(n.id);
    } else {
      this.expandedIds.add(n.id);
    }
  }

  markRead(n: Notification): void {
    if (n.isRead) { return; }
    this.notifSvc.markAsRead(n.id).subscribe({
      next: () => {
        n.isRead = true;
        this.unread = Math.max(this.unread - 1, 0);
      },
      error: (err) => console.error('Erreur lors du marquage comme lu:', err)
    });
  }

  deleteNotification(event: Event, n: Notification): void {
    
    event.stopPropagation();
    
    this.notifSvc.delete(n.id).subscribe({
      next: () => {
        
        this.notifications = this.notifications.filter(item => item.id !== n.id);
        this.updateDisplayedNotifications();
        
        
        if (!n.isRead) {
          this.unread = Math.max(this.unread - 1, 0);
        }
        
        
        this.expandedIds.delete(n.id);
      },
      error: (err) => console.error('Erreur lors de la suppression de la notification:', err)
    });
  }

  toggleViewAll(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.showingAll = !this.showingAll;
    this.updateDisplayedNotifications();
    
    
    if (this.showingAll && this.userId && this.notifications.length <= this.MAX_VISIBLE_NOTIFICATIONS) {
      
      this.notifSvc.list(this.userId).subscribe({
        next: (list) => {
          this.notifications = list;
          this.updateDisplayedNotifications();
        },
        error: (err) => console.error('Erreur lors du chargement des notifications:', err)
      });
    }
  }

  
  toggleProfileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileMenu = !this.showProfileMenu;
    this.openPanel = false; 
  }
  
  
  showUserProfile(event: Event): void {
    event.stopPropagation();
    this.showProfileMenu = false;
    
    if (!this.userId) {
      console.error('Aucun ID utilisateur disponible');
      return;
    }
    
    
    this.userSvc.getById(this.userId).subscribe({
      next: (user: User) => {
        this.userDetails = user;
        this.showProfileModal = true;
        
        
        document.body.style.overflow = 'hidden';
      },
      error: (err) => console.error('Erreur lors de la récupération du profil:', err)
    });
  }
  
  closeProfileModal(event: Event): void {
    event.stopPropagation();
    this.showProfileModal = false;
    
    
    document.body.style.overflow = 'auto';
  }
  
  navigateToSettings(event: Event): void {
    event.stopPropagation();
    this.showProfileMenu = false;
    this.router.navigate(['/settings']);
  }
  
  deleteProfilePhoto(event: Event): void {
    event.stopPropagation();
    
    if (!this.userId) {
      console.error('Aucun ID utilisateur disponible');
      return;
    }
    
    this.userSvc.deletePhoto(this.userId).subscribe({
      next: (user) => {
        
        this.avatarUrl = this.userSvc.photoUrl(null);
        this.showProfileMenu = false;
        
        
        if (this.showProfileModal && this.userDetails) {
          this.userDetails.photo = undefined;
        }
      },
      error: (err) => console.error('Erreur lors de la suppression de la photo:', err)
    });
  }
  
  logout(event: Event): void {
    event.stopPropagation();
    this.authSvc.logout();
    this.router.navigate(['/login']);
  }
  
  
  private handleOutsideClick = (event: MouseEvent) => {
    
    if (this.showProfileModal) return;
    
    
    const profileElement = (event.target as Element).closest('.profile');
    const notifElement = (event.target as Element).closest('.notif');
    const notifPanelElement = (event.target as Element).closest('.notification-panel');
    
    if (!profileElement && this.showProfileMenu) {
      this.showProfileMenu = false;
    }
    
    
    if (!notifElement && !notifPanelElement && this.openPanel) {
      this.openPanel = false;
    }
  }

  
  private refreshLatest(): void {
    if (!this.userId) { return; }
    
    this.notifSvc.latest(this.userId).subscribe({
      next: (list) => {
        this.notifications = list;
        this.showingAll = false;
        this.updateDisplayedNotifications();
        this.unread = list.filter(x => !x.isRead).length;
      },
      error: (err) => console.error('Erreur lors du chargement des dernières notifications:', err)
    });
  }
  
  private updateDisplayedNotifications(): void {
    this.displayedNotifications = this.showingAll 
      ? [...this.notifications]                                   
      : this.notifications.slice(0, this.MAX_VISIBLE_NOTIFICATIONS); 
  }

  triggerFileInput(event: Event): void {
    event.stopPropagation();
    document.getElementById('profilePhotoInput')?.click();
  }
  
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.userId) {
      const file = input.files[0];
      
      
      this.userSvc.uploadPhoto(this.userId, file).subscribe({
        next: (user) => {
          
          this.avatarUrl = this.userSvc.photoUrl(user.photo);
          
          
          if (this.userDetails) {
            this.userDetails.photo = user.photo;
          }
        },
        error: (err) => console.error('Error uploading profile photo:', err)
      });
    }
  }
}
