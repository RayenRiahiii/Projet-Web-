import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MeetingService } from '../../services/meeting.service';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Meeting, MeetingStatus } from '../../models/meeting.model';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { forkJoin, interval, Subscription } from 'rxjs';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  meetings: Meeting[];
}

interface JwtPayload {
  id: number;
  role: string;
  sub: string;
  iat: number;
  exp: number;
}

@Component({
  selector: 'app-calendrierdeveloppeur',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  templateUrl: './calendrierdeveloppeur.component.html',
  styleUrl: './calendrierdeveloppeur.component.css'
})
export class CalendrierdeveloppeurComponent implements OnInit, OnDestroy {
  
  @ViewChild('calendarContainer', { static: false }) calendarContainer?: ElementRef;

  
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  
  meetings: Meeting[] = [];
  filteredMeetings: Meeting[] = [];
  
  
  searchTerm: string = '';
  
  
  userId?: number;
  userRole?: string;
  
  
  selectedMeeting: Meeting | null = null;
  showMeetingDetailsModal: boolean = false;
  
  
  isLoading: boolean = false;
  monthNames: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  
  notificationVisible: boolean = false;
  notificationMessage: string = '';
  
  
  meetingParticipants: User[] = [];
  
  
  private statusCheckInterval: Subscription | null = null;

  constructor(
    private meetingService: MeetingService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private renderer: Renderer2
  ) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
    this.generateCalendar();
    this.loadMeetings();
    
    
    this.setupStatusCheckInterval();
  }
  
  ngOnDestroy(): void {
    
    if (this.statusCheckInterval) {
      this.statusCheckInterval.unsubscribe();
      this.statusCheckInterval = null;
    }
  }
  
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        this.userId = decoded.id;
        this.userRole = decoded.role;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }
  
  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    
    const firstDayOfWeek = firstDay.getDay();
    
    
    const prevMonthDays = firstDayOfWeek;
    const startDate = new Date(year, month, 1 - prevMonthDays);
    
    
    const daysInMonth = lastDay.getDate();
    const lastDayOfWeek = lastDay.getDay();
    const nextMonthDays = 6 - lastDayOfWeek;
    
    
    const totalDays = prevMonthDays + daysInMonth + nextMonthDays;
    
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const calendarDay: CalendarDay = {
        date: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        meetings: []
      };
      
      this.calendarDays.push(calendarDay);
    }
  }
  
  loadMeetings(callback?: () => void): void {
    this.isLoading = true;
    
    if (this.userId) {
      
      const firstDay = this.calendarDays[0].date;
      const lastDay = this.calendarDays[this.calendarDays.length - 1].date;
      
      
      this.meetingService.getForDeveloper(this.userId).subscribe({
        next: (data) => {
          
          this.meetings = data.filter(meeting => {
            const meetingDate = new Date(meeting.dateHeure);
            return meetingDate >= firstDay && meetingDate <= lastDay;
          });
          
          
          this.updateMeetingStatuses();
          
          this.filteredMeetings = [...this.meetings];
          this.populateCalendarWithMeetings();
          this.isLoading = false;
          
          
          if (callback) {
            callback();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des réunions:', error);
          this.showNotification('Erreur lors du chargement des réunions. Veuillez réessayer.', 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      if (callback) {
        callback();
      }
    }
  }
  
  populateCalendarWithMeetings(): void {
    
    this.calendarDays.forEach(day => {
      day.meetings = [];
    });
    
    
    this.filteredMeetings.forEach(meeting => {
      const meetingDate = new Date(meeting.dateHeure);
      
      
      const calendarDay = this.calendarDays.find(day => 
        day.date.getDate() === meetingDate.getDate() && 
        day.date.getMonth() === meetingDate.getMonth() && 
        day.date.getFullYear() === meetingDate.getFullYear()
      );
      
      if (calendarDay) {
        calendarDay.meetings.push(meeting);
      }
    });
  }
  
  searchMeetings(): void {
    if (!this.searchTerm.trim()) {
      
      this.filteredMeetings = [...this.meetings];
      this.populateCalendarWithMeetings();
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    
    
    this.filteredMeetings = this.meetings.filter(meeting => 
      meeting.sujet.toLowerCase().includes(term) || 
      (meeting.description && meeting.description.toLowerCase().includes(term))
    );
    
    this.populateCalendarWithMeetings();
    
    if (this.filteredMeetings.length === 0) {
      this.showNotification('Aucune réunion trouvée', 'info');
    } else {
      this.highlightFoundMeetings();
    }
  }
  
  highlightFoundMeetings(): void {
    
    document.querySelectorAll('.meeting-item.highlighted').forEach(el => {
      el.classList.remove('highlighted');
    });
    
    
    setTimeout(() => {
      
      const meetingItems = document.querySelectorAll('.meeting-item');
      const foundIds = this.filteredMeetings.map(m => m.id);
      
      meetingItems.forEach(item => {
        
        const meetingId = this.findMeetingIdFromElement(item);
        if (meetingId && foundIds.includes(meetingId)) {
          item.classList.add('highlighted');
          
          
          if (meetingId === foundIds[0]) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }, 100);
  }
  
  findMeetingIdFromElement(element: Element): number | null {
    const meetingTitle = element.querySelector('.meeting-title')?.textContent;
    const meetingTime = element.querySelector('.meeting-time')?.textContent;
    
    if (meetingTitle && meetingTime) {
      
      const meeting = this.meetings.find(m => 
        m.sujet === meetingTitle && 
        this.getFormattedTime(m.dateHeure) === meetingTime
      );
      
      return meeting?.id || null;
    }
    
    return null;
  }
  
  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.loadMeetings();
  }
  
  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.loadMeetings();
  }
  
  currentMonth(): void {
    this.currentDate = new Date();
    this.generateCalendar();
    this.loadMeetings();
  }
  
  openMeetingDetails(meeting: Meeting): void {
    this.selectedMeeting = meeting;
    this.showMeetingDetailsModal = true;
    
    
    this.loadMeetingParticipants(meeting);
  }
  
  loadMeetingParticipants(meeting: Meeting): void {
    if (!meeting.participantIds || meeting.participantIds.length === 0) {
      this.meetingParticipants = [];
      return;
    }
    
    
    const userObservables = meeting.participantIds.map(id => 
      this.userService.getById(id)
    );
    
    forkJoin(userObservables).subscribe({
      next: (participants) => {
        this.meetingParticipants = participants;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des participants :', error);
        this.showNotification('Impossible de charger les participants', 'error');
        this.meetingParticipants = [];
      }
    });
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    
    const nameParts = name.split(' ');
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
  
  getProjectName(projectId: number): string {
    
    return `Projet #${projectId}`;
  }
  
  closeMeetingDetailsModal(): void {
    this.showMeetingDetailsModal = false;
    this.selectedMeeting = null;
  }
  
  getStatusClass(status?: MeetingStatus): string {
    switch(status) {
      case 'A_VENIR':
        return 'status-A_VENIR';
      case 'EN_COURS':
        return 'status-EN_COURS';
      case 'TERMINE':
        return 'status-TERMINE';
      default:
        return 'status-A_VENIR'; 
    }
  }
  
  getDayClass(day: CalendarDay): string {
    let classes = 'calendar-day';
    
    if (!day.isCurrentMonth) {
      classes += ' outside-month';
    }
    
    if (day.isToday) {
      classes += ' current-day';
    }
    
    return classes;
  }
  
  getFormattedTime(dateString?: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  showNotification(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
    this.notificationMessage = message;
    this.notificationVisible = true;
    
    
    const notificationEl = this.renderer.createElement('div');
    this.renderer.addClass(notificationEl, 'notification');
    this.renderer.addClass(notificationEl, `notification-${type}`);
    
    const textEl = this.renderer.createText(message);
    this.renderer.appendChild(notificationEl, textEl);
    
    
    document.body.appendChild(notificationEl);
    
    
    setTimeout(() => {
      this.renderer.addClass(notificationEl, 'show');
    }, 10);
    
    
    setTimeout(() => {
      this.renderer.removeClass(notificationEl, 'show');
      setTimeout(() => {
        document.body.removeChild(notificationEl);
        this.notificationVisible = false;
      }, 300);
    }, 3000);
  }
  
  
  updateMeetingStatuses(): void {
    if (!this.meetings || this.meetings.length === 0) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
    
    this.meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.dateHeure);
      const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      
      if (meetingDay.getTime() === today.getTime() && meeting.statut !== 'EN_COURS') {
        meeting.statut = 'EN_COURS';
      } else if (meetingDay.getTime() < today.getTime() && meeting.statut !== 'TERMINE') {
        meeting.statut = 'TERMINE';
      }
    });
  }

  
  setupStatusCheckInterval(): void {
    
    this.statusCheckInterval = interval(3600 * 1000).subscribe(() => {
      if (this.meetings && this.meetings.length > 0) {
        this.updateMeetingStatuses();
      }
    });
  }
}
