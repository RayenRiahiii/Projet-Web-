import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MeetingService } from '../../../services/meeting.service';
import { ProjectService } from '../../../services/project.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Meeting, MeetingStatus, MeetingDto } from '../../../models/meeting.model';
import { Project } from '../../../models/project.model';
import { User, UserRole } from '../../../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { forkJoin, lastValueFrom, interval, Subscription } from 'rxjs';

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
  selector: 'app-meetings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  templateUrl: './meetings.component.html',
  styleUrl: './meetings.component.css'
})
export class MeetingsComponent implements OnInit, OnDestroy {
  
  @ViewChild('calendarContainer', { static: false }) calendarContainer?: ElementRef;

  
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  
  meetings: Meeting[] = [];
  filteredMeetings: Meeting[] = [];
  
  
  searchTerm: string = '';
  
  
  userId?: number;
  userRole?: string;
  
  
  showAddMeetingModal: boolean = false;
  selectedMeeting: Meeting | null = null;
  showMeetingDetailsModal: boolean = false;
  showEditMeetingModal: boolean = false;
  showDeleteConfirmation: boolean = false;
  
  
  isLoading: boolean = false;
  monthNames: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  
  meetingForm: FormGroup;
  projets: Project[] = [];
  projectDevelopers: User[] = [];
  selectedParticipants: number[] = [];
  meetingParticipants: User[] = [];
  submitting: boolean = false;
  errorMsg?: string;
  
  
  notificationVisible: boolean = false;
  notificationMessage: string = '';
  
  
  dropListIds: string[] = [];

  
  private statusCheckInterval: Subscription | null = null;

  constructor(
    private meetingService: MeetingService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private renderer: Renderer2
  ) {
    
    this.meetingForm = this.fb.group({
      sujet: ['', [Validators.required]],
      description: [''],
      projetId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      heure: ['', [Validators.required]],
      statut: ['A_VENIR'],
      rappel: [false]
    });
  }
  
  ngOnInit(): void {
    this.loadUserInfo();
    this.generateCalendar();
    this.loadMeetings();
    this.loadProjects();
    
    
    this.enableTouchDragDrop();
    
    
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
  
  
  getDropListId(day: CalendarDay): string {
    return 'drop-list-' + day.date.toISOString().split('T')[0];
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
    
    
    this.dropListIds = this.calendarDays.map(d => this.getDropListId(d));
  }
  
  loadMeetings(callback?: () => void): void {
    this.isLoading = true;
    this.errorMsg = undefined;
    
    if (this.userId) {
      
      const firstDay = this.calendarDays[0].date;
      const lastDay = this.calendarDays[this.calendarDays.length - 1].date;
      
      
      this.meetingService.getAll().subscribe({
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
          console.error('Error loading meetings:', error);
          this.errorMsg = 'Erreur lors du chargement des réunions. Veuillez réessayer.';
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
  
  formatDateForApi(date: Date): string {
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
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
    
    
    this.isLoading = true;
    
    
    this.meetingService.searchBySujet(term).subscribe({
      next: (results) => {
        if (results.length === 0) {
          
          this.filteredMeetings = [];
          this.populateCalendarWithMeetings();
          this.showNotification('Aucune réunion trouvée', 'info');
          this.isLoading = false;
        } else {
          
          const firstResult = results[0]; 
          const meetingDate = new Date(firstResult.dateHeure);
          const currentViewMonth = this.currentDate.getMonth();
          const currentViewYear = this.currentDate.getFullYear();
          
          
          if (meetingDate.getMonth() !== currentViewMonth || 
              meetingDate.getFullYear() !== currentViewYear) {
                
            
            this.currentDate = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), 1);
            
            
            this.generateCalendar();
            
            
            this.loadMeetings(() => {
              
              this.filteredMeetings = results;
              this.populateCalendarWithMeetings();
              this.highlightFoundMeetings();
              this.showNotification(`Réunion trouvée en ${this.monthNames[meetingDate.getMonth()]} ${meetingDate.getFullYear()}`, 'success');
            });
          } else {
            
            this.filteredMeetings = results;
            this.populateCalendarWithMeetings();
            this.highlightFoundMeetings();
            this.isLoading = false;
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        
        this.isLoading = false;
        this.filteredMeetings = this.meetings.filter(meeting => 
          meeting.sujet.toLowerCase().includes(term) || 
          (meeting.description && meeting.description.toLowerCase().includes(term))
        );
        this.populateCalendarWithMeetings();
      }
    });
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
  
  toggleAddMeetingModal(date?: Date): void {
    if (!this.showAddMeetingModal) {
      
      this.resetMeetingForm();
      
      
      if (date) {
        const formattedDate = this.formatDateForForm(date);
        this.meetingForm.patchValue({ 
          date: formattedDate,
          heure: '10:00' 
        });
      }
      
      this.selectedParticipants = [];
      this.projectDevelopers = [];
      this.errorMsg = undefined;
    }
    
    this.showAddMeetingModal = !this.showAddMeetingModal;
  }

  formatDateForForm(date: Date): string {
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const project = this.projets.find(p => p.id === projectId);
    return project ? project.nom : 'Projet non trouvé';
  }
  
  closeMeetingDetailsModal(): void {
    this.showMeetingDetailsModal = false;
    this.selectedMeeting = null;
  }
  
  onDrop(event: CdkDragDrop<Meeting[]>, targetDate: Date): void {
    if (!event.item.data) {
      console.error('Données de réunion manquantes');
      return;
    }
    
    const meeting = event.item.data as Meeting;
    
    
    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    
    
    if (meeting.statut !== 'A_VENIR') {
      this.showNotification('Seules les réunions à venir peuvent être déplacées');
      return;
    }
    
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      this.showNotification('Les réunions ne peuvent être déplacées que vers des dates futures');
      return;
    }
    
    
    const meetingDate = new Date(meeting.dateHeure);
    if (
      meetingDate.getDate() === targetDate.getDate() &&
      meetingDate.getMonth() === targetDate.getMonth() &&
      meetingDate.getFullYear() === targetDate.getFullYear()
    ) {
      console.log('Même jour, pas de modification nécessaire');
      return;
    }
    
    
    const originalDate = new Date(meeting.dateHeure);
    const newDate = new Date(targetDate);
    newDate.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds()
    );
    
    
    const newDateString = newDate.toISOString();
    
    
    const updatedMeeting: MeetingDto = {
      sujet: meeting.sujet,
      description: meeting.description,
      dateHeure: newDateString,
      projetId: meeting.projetId,
      managerId: meeting.managerId,
      participantIds: meeting.participantIds,
      rappel: meeting.rappel,
      statut: meeting.statut
    };
    
    this.showNotification('Déplacement en cours...', 'info');
    
    
    this.meetingService.update(meeting.id, updatedMeeting).subscribe({
      next: (response) => {
        
        const index = this.meetings.findIndex(m => m.id === meeting.id);
        if (index !== -1) {
          this.meetings[index] = response;
          
          
          const filteredIndex = this.filteredMeetings.findIndex(m => m.id === meeting.id);
          if (filteredIndex !== -1) {
            this.filteredMeetings[filteredIndex] = response;
          }
          
          
          this.populateCalendarWithMeetings();
          
          
          this.showNotification('Réunion déplacée avec succès', 'success');
        }
      },
      error: (error) => {
        console.error('Error updating meeting date:', error);
        
        this.loadMeetings();
        this.showNotification('Erreur lors du déplacement de la réunion', 'error');
      }
    });
  }
  
  
  isDateDraggable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
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

  
  loadProjects(): void {
    if (!this.userId) return;
    
    if (this.userRole === 'MANAGER') {
      this.projectService.getByManager(this.userId).subscribe({
        next: (projects) => {
          this.projets = projects;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.errorMsg = 'Erreur lors du chargement des projets';
        }
      });
    } else {
      this.projectService.getAll().subscribe({
        next: (projects) => {
          this.projets = projects;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.errorMsg = 'Erreur lors du chargement des projets';
        }
      });
    }
  }

  onProjectSelect(): void {
    const projectId = this.meetingForm.get('projetId')?.value;
    if (!projectId) {
      this.projectDevelopers = [];
      return;
    }

    
    this.projectService.getDetails(projectId).subscribe({
      next: (project) => {
        if (project.assignedDevelopers && project.assignedDevelopers.length > 0) {
          
          const userObservables = project.assignedDevelopers.map(dev => 
            this.userService.getById(dev.id)
          );
          
          forkJoin(userObservables).subscribe({
            next: (developers) => {
              this.projectDevelopers = developers.filter(dev => dev.role === UserRole.DEVELOPPEUR);
            },
            error: (error) => {
              console.error('Error loading developer details:', error);
              this.errorMsg = 'Erreur lors du chargement des développeurs';
            }
          });
        } else {
          this.projectDevelopers = [];
        }
      },
      error: (error) => {
        console.error('Error loading project details:', error);
        this.errorMsg = 'Erreur lors du chargement des détails du projet';
        this.projectDevelopers = [];
      }
    });
  }

  toggleParticipant(developerId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    
    if (checked) {
      if (!this.selectedParticipants.includes(developerId)) {
        this.selectedParticipants.push(developerId);
      }
    } else {
      const index = this.selectedParticipants.indexOf(developerId);
      if (index !== -1) {
        this.selectedParticipants.splice(index, 1);
      }
    }
  }

  resetMeetingForm(): void {
    const today = new Date();
    const todayFormatted = this.formatDateForForm(today);
    
    this.meetingForm.reset({
      sujet: '',
      description: '',
      projetId: '',
      date: todayFormatted,
      heure: '10:00',
      statut: 'A_VENIR',
      rappel: false
    });
  }

  onSubmitMeeting(): void {
    if (this.meetingForm.invalid || !this.userId) {
      return;
    }
    
    this.submitting = true;
    this.errorMsg = undefined;
    
    const formValue = this.meetingForm.value;
    
    
    const dateTimeStr = `${formValue.date}T${formValue.heure}:00`;
    
    const meetingDto: MeetingDto = {
      sujet: formValue.sujet,
      description: formValue.description || undefined,
      dateHeure: dateTimeStr,
      projetId: parseInt(formValue.projetId),
      managerId: this.userId,
      participantIds: this.selectedParticipants.length > 0 ? this.selectedParticipants : undefined,
      rappel: formValue.rappel,
      statut: formValue.statut
    };
    
    this.meetingService.create(meetingDto).subscribe({
      next: (meeting) => {
        
        this.meetings.push(meeting);
        this.filteredMeetings = [...this.meetings];
        this.populateCalendarWithMeetings();
        
        
        this.toggleAddMeetingModal();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error creating meeting:', error);
        this.errorMsg = 'Erreur lors de la création de la réunion';
        this.submitting = false;
      }
    });
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
  
  
  private enableTouchDragDrop(): void {
    if (typeof document !== 'undefined') {
      
      document.addEventListener('touchmove', (event) => {
        if (document.querySelector('.cdk-drag-preview')) {
          event.preventDefault();
        }
      }, { passive: false });
    }
  }

  
  updateMeetingStatuses(): void {
    if (!this.meetings || this.meetings.length === 0) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); 
    
    const statusUpdates: Promise<Meeting | null>[] = [];
    
    this.meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.dateHeure);
      const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate()); 
      
      let newStatus: MeetingStatus | null = null;
      
      
      if (meetingDay.getTime() === today.getTime() && meeting.statut !== 'EN_COURS') {
        newStatus = 'EN_COURS';
      } 
      
      else if (meetingDay.getTime() < today.getTime() && meeting.statut !== 'TERMINE') {
        newStatus = 'TERMINE';
      }
      
      
      if (newStatus) {
        const updatedMeeting: MeetingDto = {
          sujet: meeting.sujet,
          description: meeting.description,
          dateHeure: meeting.dateHeure,
          projetId: meeting.projetId,
          managerId: meeting.managerId,
          participantIds: meeting.participantIds,
          rappel: meeting.rappel,
          statut: newStatus
        };
        
        
        statusUpdates.push(
          lastValueFrom(this.meetingService.update(meeting.id, updatedMeeting))
            .then(response => {
              
              meeting.statut = newStatus as MeetingStatus;
              console.log(`Réunion #${meeting.id} mise à jour: ${newStatus}`);
              return response;
            })
            .catch(error => {
              console.error(`Erreur lors de la mise à jour du statut de la réunion #${meeting.id}:`, error);
              return null;
            })
        );
      }
    });
    
    
    if (statusUpdates.length > 0) {
      Promise.all(statusUpdates).then(() => {
        console.log(`${statusUpdates.length} réunions ont été mises à jour automatiquement`);
      });
    }
  }

  
  setupStatusCheckInterval(): void {
    
    this.statusCheckInterval = interval(3600 * 1000).subscribe(() => {
      if (this.meetings && this.meetings.length > 0) {
        console.log("Mise à jour automatique des statuts des réunions...");
        this.updateMeetingStatuses();
      }
    });
  }

  
  openEditMeetingModal(meeting: Meeting): void {
    this.selectedMeeting = meeting;
    this.showMeetingDetailsModal = false;
    this.showEditMeetingModal = true;
    this.errorMsg = undefined;
    
    
    this.projectService.getDetails(meeting.projetId).subscribe({
      next: (project) => {
        if (project.assignedDevelopers && project.assignedDevelopers.length > 0) {
          const userObservables = project.assignedDevelopers.map(dev => 
            this.userService.getById(dev.id)
          );
          
          forkJoin(userObservables).subscribe({
            next: (developers) => {
              this.projectDevelopers = developers.filter(dev => dev.role === UserRole.DEVELOPPEUR);
              
              
              this.populateEditForm(meeting);
            },
            error: (error) => {
              console.error('Erreur lors du chargement des développeurs :', error);
              this.showNotification('Impossible de charger les développeurs', 'error');
              this.projectDevelopers = [];
              this.populateEditForm(meeting);
            }
          });
        } else {
          this.projectDevelopers = [];
          this.populateEditForm(meeting);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails du projet :', error);
        this.showNotification('Impossible de charger les détails du projet', 'error');
        this.projectDevelopers = [];
        this.populateEditForm(meeting);
      }
    });
  }
  
  
  populateEditForm(meeting: Meeting): void {
    const meetingDate = new Date(meeting.dateHeure);
    
    
    const formattedDate = this.formatDateForForm(meetingDate);
    
    
    const hours = meetingDate.getHours().toString().padStart(2, '0');
    const minutes = meetingDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    
    this.selectedParticipants = meeting.participantIds || [];
    
    
    this.meetingForm.patchValue({
      sujet: meeting.sujet,
      description: meeting.description || '',
      projetId: meeting.projetId.toString(),
      date: formattedDate,
      heure: formattedTime,
      statut: meeting.statut || 'A_VENIR',
      rappel: meeting.rappel
    });
  }
  
  
  closeEditMeetingModal(): void {
    this.showEditMeetingModal = false;
    this.selectedMeeting = null;
    this.errorMsg = undefined;
  }
  
  
  isParticipantSelected(id: number): boolean {
    return this.selectedParticipants.includes(id);
  }
  
  
  onUpdateMeeting(): void {
    if (this.meetingForm.invalid || !this.userId || !this.selectedMeeting) {
      return;
    }
    
    this.submitting = true;
    this.errorMsg = undefined;
    
    const formValue = this.meetingForm.value;
    
    
    const dateTimeStr = `${formValue.date}T${formValue.heure}:00`;
    
    const meetingDto: MeetingDto = {
      sujet: formValue.sujet,
      description: formValue.description || undefined,
      dateHeure: dateTimeStr,
      projetId: parseInt(formValue.projetId),
      managerId: this.userId,
      participantIds: this.selectedParticipants.length > 0 ? this.selectedParticipants : undefined,
      rappel: formValue.rappel,
      statut: formValue.statut
    };
    
    this.meetingService.update(this.selectedMeeting.id, meetingDto).subscribe({
      next: (updatedMeeting) => {
        
        const index = this.meetings.findIndex(m => m.id === updatedMeeting.id);
        if (index !== -1) {
          this.meetings[index] = updatedMeeting;
          
          
          const filteredIndex = this.filteredMeetings.findIndex(m => m.id === updatedMeeting.id);
          if (filteredIndex !== -1) {
            this.filteredMeetings[filteredIndex] = updatedMeeting;
          }
          
          
          this.populateCalendarWithMeetings();
        }
        
        
        this.closeEditMeetingModal();
        this.submitting = false;
        this.showNotification('Réunion mise à jour avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de la réunion :', error);
        this.errorMsg = 'Erreur lors de la mise à jour de la réunion';
        this.submitting = false;
      }
    });
  }
  
  
  confirmDeleteMeeting(meeting: Meeting): void {
    this.selectedMeeting = meeting;
    this.showDeleteConfirmation = true;
  }
  
  
  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
  }
  
  
  deleteMeeting(): void {
    if (!this.selectedMeeting) return;
    
    this.submitting = true;
    
    this.meetingService.delete(this.selectedMeeting.id).subscribe({
      next: () => {
        
        this.meetings = this.meetings.filter(m => m.id !== this.selectedMeeting!.id);
        this.filteredMeetings = this.filteredMeetings.filter(m => m.id !== this.selectedMeeting!.id);
        
        
        this.populateCalendarWithMeetings();
        
        
        this.closeDeleteConfirmation();
        this.closeMeetingDetailsModal();
        this.submitting = false;
        this.showNotification('Réunion supprimée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la réunion :', error);
        this.submitting = false;
        this.closeDeleteConfirmation();
        this.showNotification('Erreur lors de la suppression de la réunion', 'error');
      }
    });
  }
}
