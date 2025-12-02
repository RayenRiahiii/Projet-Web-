import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { GanttService } from '../../../services/gantt.service';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { Project } from '../../../models/project.model';
import { GanttTaskDto, TaskDto } from '../../../models/task.model';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';


import { DragDropModule } from '@angular/cdk/drag-drop';


interface JwtPayload {
  id: number;
  role: string;
  sub: string;
  iat: number;
  exp: number;
}


interface GanttMonth {
  name: string;         
  year: number;         
  startDate: Date;      
  endDate: Date;        
  days: GanttDay[];     
}


interface GanttDay {
  date: Date;
  dayNumber: number;
  isWeekend: boolean;
  isToday: boolean;
  displayDay: number;   
  isStartOfGroup: boolean; 
}


enum ResizePosition {
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none'
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent implements OnInit, OnDestroy {
  @ViewChild('ganttContainer', { static: false }) ganttContainer!: ElementRef;
  
  
  userId?: number;
  userRole?: string;
  
  
  projects: Project[] = [];
  selectedProjectId: number | null = null;
  
  
  ganttTasks: GanttTaskDto[] = [];
  isLoading: boolean = false;
  errorMsg?: string;
  
  
  currentDate: Date = new Date();
  displayMonths: GanttMonth[] = [];
  monthsToShow: number = 1;
  
  
  isResizing: boolean = false;
  resizePosition: ResizePosition = ResizePosition.NONE;
  resizingTaskId: number | null = null;
  initialTaskStartDate: Date | null = null;
  initialTaskEndDate: Date | null = null;
  initialX: number = 0;
  dayWidth: number = 0;
  
  
  get currentMonthLabel(): string {
    const month = this.currentDate.toLocaleString('fr-FR', { month: 'long' });
    const year = this.currentDate.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }
  
  
  priorityColors = {
    'HAUTE': '#FF4F70',     
    'MOYENNE': '#9747FF',   
    'BASSE': '#4871FF'      
  };
  
  
  private subscriptions = new Subscription();
  
  constructor(
    private projectService: ProjectService,
    private ganttService: GanttService,
    private taskService: TaskService,
    private authService: AuthService,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
    this.generateTimeline();
    
    
    this.setupResizeListeners();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.removeResizeListeners();
  }
  
  
  setupResizeListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }
  
  
  removeResizeListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
  }
  
  
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        this.userId = decoded.id;
        this.userRole = decoded.role;
        
        
        if (this.userId) {
          this.loadManagerProjects();
        }
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        this.showNotification('Erreur d\'authentification', 'error');
      }
    } else {
      this.showNotification('Non authentifié', 'error');
    }
  }
  
  
  loadManagerProjects(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    
    const sub = this.projectService.getByManager(this.userId).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des projets:', error);
        this.showNotification('Erreur lors du chargement des projets', 'error');
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  
  selectProject(projectId: number): void {
    this.selectedProjectId = projectId;
    this.loadGanttTasks();
  }
  
  
  formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  
  parseISODate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }
  
  
  loadGanttTasks(): void {
    if (!this.selectedProjectId) return;
    
    this.isLoading = true;
    this.ganttTasks = [];
    this.errorMsg = undefined;
    
    const sub = this.ganttService.getTasksByProject(this.selectedProjectId).subscribe({
      next: (tasks) => {
        this.ganttTasks = tasks;
        this.isLoading = false;
        
        
        if (tasks.length === 0) {
          this.showNotification('Aucune tâche planifiée pour ce projet', 'info');
        }
        
        
        this.adjustTimelineToTasks();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des tâches Gantt:', error);
        this.isLoading = false;
        
        
        this.errorMsg = `Erreur lors du chargement des tâches: ${error.message || 'Problème de communication avec le serveur'}`;
        this.showNotification('Erreur lors du chargement des tâches', 'error');
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  
  generateTimeline(): void {
    this.displayMonths = [];
    
    
    for (let i = 0; i < this.monthsToShow; i++) {
      const monthDate = new Date(this.currentDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      monthDate.setDate(1); 
      
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      
      const lastDay = new Date(year, month + 1, 0);
      
      const monthName = monthDate.toLocaleString('fr-FR', { month: 'long' });
      
      
      const ganttMonth: GanttMonth = {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        year: year,
        startDate: new Date(year, month, 1),
        endDate: lastDay,
        days: this.generateDaysForMonth(year, month)
      };
      
      this.displayMonths.push(ganttMonth);
    }
  }
  
  
  generateDaysForMonth(year: number, month: number): GanttDay[] {
    const days: GanttDay[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      
      const isStartOfGroup = day % 2 === 1;
      
      
      const displayDay = day;
      
      
      if (isStartOfGroup) {
        days.push({
          date: date,
          dayNumber: day,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6, 
          isToday: isToday,
          displayDay: displayDay,
          isStartOfGroup: isStartOfGroup
        });
      }
    }
    
    return days;
  }
  
  
  getVisibleDaysCount(): number {
    let totalDays = 0;
    for (const month of this.displayMonths) {
      
      totalDays += month.days.length;
    }
    return totalDays;
  }
  
  
  adjustTimelineToTasks(): void {
    if (this.ganttTasks.length === 0) return;
    
    
    let earliestDate: Date | null = null;
    
    for (const task of this.ganttTasks) {
      if (task.dateDebutPrevue) {
        const startDate = new Date(task.dateDebutPrevue);
        if (!earliestDate || startDate < earliestDate) {
          earliestDate = startDate;
        }
      }
    }
    
    
    if (earliestDate) {
      
      if (earliestDate < this.displayMonths[0].startDate) {
        this.currentDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        this.generateTimeline();
      }
    }
  }
  
  
  goToPreviousMonth(): void {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate = newDate;
    this.generateTimeline();
  }
  
  
  goToNextMonth(): void {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate = newDate;
    this.generateTimeline();
  }
  
  
  goToCurrentMonth(): void {
    this.currentDate = new Date();
    this.generateTimeline();
  }
  
  
  getTaskBarStyle(task: GanttTaskDto): any {
    if (!task.dateDebutPrevue || !task.dateFinPrevue) {
      return { display: 'none' };
    }
    
    const startDate = new Date(task.dateDebutPrevue);
    const endDate = new Date(task.dateFinPrevue);
    
    
    if (endDate < this.displayMonths[0].startDate || 
        startDate > this.displayMonths[this.displayMonths.length - 1].endDate) {
      return { display: 'none' };
    }
    
    
    const timelineStartDate = this.displayMonths[0].startDate;
    let diffStart = Math.max(0, this.getDaysDifference(timelineStartDate, startDate));
    
    
    diffStart = Math.floor(diffStart / 2);
    
    
    let duration = this.getDaysDifference(startDate, endDate) + 1; 
    
    
    duration = Math.ceil(duration / 2);
    
    
    const visibleDays = this.getVisibleDaysCount();
    this.dayWidth = 100 / visibleDays;
    
    
    const left = diffStart * this.dayWidth;
    const width = duration * this.dayWidth;
    
    
    let backgroundColor = '#2196F3'; 
    
    
    if (task.id === 1) {
      backgroundColor = this.getTaskColorByStatus('TERMINE');
    } else if (task.id === 2) {
      backgroundColor = this.getTaskColorByStatus('EN_COURS');
    } else if (task.id === 3) {
      backgroundColor = this.getTaskColorByStatus('EN_ATTENTE');
    }
    
    
    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: backgroundColor,
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      height: '32px',
      position: 'absolute',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      cursor: 'move'
    };
  }
  
  
  startResize(event: MouseEvent, taskId: number, position: 'left' | 'right'): void {
    event.preventDefault();
    event.stopPropagation();
    
    
    const resizePos = position === 'left' ? ResizePosition.LEFT : ResizePosition.RIGHT;
    
    const task = this.ganttTasks.find(t => t.id === taskId);
    if (!task || !task.dateDebutPrevue || !task.dateFinPrevue) {
      console.warn(`Impossible de redimensionner la tâche ${taskId}: données incomplètes`);
      return;
    }
    
    
    const actionText = position === 'left' ? 'date de début' : 'date de fin';
    this.showNotification(`Modification de la ${actionText} en cours...`, 'info');
    
    this.isResizing = true;
    this.resizingTaskId = taskId;
    this.resizePosition = resizePos;
    this.initialX = event.clientX;
    
    
    this.initialTaskStartDate = new Date(task.dateDebutPrevue);
    this.initialTaskEndDate = new Date(task.dateFinPrevue);
    
    
    document.body.classList.add('resizing');
    
    console.log(`Début de redimensionnement: tâche ${taskId}, position ${position}`);
  }
  
  
  handleMouseMove(event: MouseEvent): void {
    if (!this.isResizing || this.resizingTaskId === null) return;
    
    const deltaX = event.clientX - this.initialX;
    const dayWidthPx = document.querySelector('.day-cell')?.clientWidth || 48; 
    const daysDelta = Math.round(deltaX / dayWidthPx) * 2; 
    
    if (daysDelta === 0) return;
    
    const task = this.ganttTasks.find(t => t.id === this.resizingTaskId);
    if (!task || !this.initialTaskStartDate || !this.initialTaskEndDate) return;
    
    const newTask = { ...task };
    
    
    if (this.resizePosition === ResizePosition.LEFT) {
      
      const newStartDate = new Date(this.initialTaskStartDate);
      newStartDate.setDate(newStartDate.getDate() + daysDelta);
      
      
      if (newStartDate < this.initialTaskEndDate) {
        task.dateDebutPrevue = this.formatDateToISO(newStartDate);
      }
    } else if (this.resizePosition === ResizePosition.RIGHT) {
      
      const newEndDate = new Date(this.initialTaskEndDate);
      newEndDate.setDate(newEndDate.getDate() + daysDelta);
      
      
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      if (newEndDate > this.initialTaskStartDate && newEndDate >= yesterday) {
        task.dateFinPrevue = this.formatDateToISO(newEndDate);
      }
    }
    
    
    this.ganttTasks = [...this.ganttTasks];
  }
  
  
  handleMouseUp(event: MouseEvent): void {
    if (!this.isResizing || this.resizingTaskId === null) return;
    
    const task = this.ganttTasks.find(t => t.id === this.resizingTaskId);
    if (!task || !task.dateDebutPrevue || !task.dateFinPrevue) {
      this.resetResizeState();
      return;
    }
    
    
    if (this.initialTaskStartDate && this.initialTaskEndDate) {
      const startDateChanged = this.formatDateToISO(this.initialTaskStartDate) !== task.dateDebutPrevue;
      const endDateChanged = this.formatDateToISO(this.initialTaskEndDate) !== task.dateFinPrevue;
      
      if (startDateChanged || endDateChanged) {
        
        let message = '';
        
        if (startDateChanged) {
          const oldDate = this.formatDateToISO(this.initialTaskStartDate);
          const newDate = task.dateDebutPrevue;
          message += `Date de début modifiée: ${oldDate} → ${newDate}. `;
        }
        
        if (endDateChanged) {
          const oldDate = this.formatDateToISO(this.initialTaskEndDate);
          const newDate = task.dateFinPrevue;
          message += `Date de fin modifiée: ${oldDate} → ${newDate}.`;
        }
        
        console.log(message);
        
        
        this.updateTaskDates(task);
      } else {
        
        this.showNotification('Aucune modification des dates effectuée', 'info');
      }
    }
    
    this.resetResizeState();
  }
  
  
  resetResizeState(): void {
    this.isResizing = false;
    this.resizingTaskId = null;
    this.initialTaskStartDate = null;
    this.initialTaskEndDate = null;
    this.resizePosition = ResizePosition.NONE;
    document.body.classList.remove('resizing');
  }
  
  
  updateTaskDates(task: GanttTaskDto): void {
    if (!task.id || !task.dateDebutPrevue || !task.dateFinPrevue) return;
    
    
    const updateData: Partial<TaskDto> = {
      dateDebutPrevue: task.dateDebutPrevue,
      dateFinPrevue: task.dateFinPrevue
    };
    
    this.taskService.updateDates(task.id, updateData).subscribe({
      next: (updatedTask) => {
        this.showNotification('Dates de la tâche mises à jour avec succès', 'success');
        
        
        this.ganttTasks = this.ganttTasks.map(t => {
          if (t.id === updatedTask.id) {
            
            const dateDebutPrevue = updatedTask.dateDebutPrevue || task.dateDebutPrevue;
            const dateFinPrevue = updatedTask.dateFinPrevue || task.dateFinPrevue;
            
            return { 
              ...t, 
              dateDebutPrevue,
              dateFinPrevue
            };
          }
          return t;
        });
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des dates:', error);
        this.showNotification('Erreur lors de la mise à jour des dates', 'error');
        
        
        if (this.initialTaskStartDate && this.initialTaskEndDate) {
          const taskToReset = this.ganttTasks.find(t => t.id === task.id);
          if (taskToReset) {
            taskToReset.dateDebutPrevue = this.formatDateToISO(this.initialTaskStartDate);
            taskToReset.dateFinPrevue = this.formatDateToISO(this.initialTaskEndDate);
            this.ganttTasks = [...this.ganttTasks];
          }
        }
      }
    });
  }
  
  
  getDaysDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  
  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.nom : 'Projet non trouvé';
  }
  
  
  showNotification(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    
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
      }, 300);
    }, 3000);
  }
  
  
  getDayDisplay(day: GanttDay): string {
    
    const nextDay = day.dayNumber + 1;
    if (nextDay <= new Date(day.date.getFullYear(), day.date.getMonth() + 1, 0).getDate()) {
      return `${day.dayNumber}-${nextDay}`;
    }
    return day.dayNumber.toString();
  }
  
  
  getTaskDurationInDays(task: GanttTaskDto): string {
    if (!task.dateDebutPrevue || !task.dateFinPrevue) {
      return '-';
    }
    
    try {
      const startDate = new Date(task.dateDebutPrevue);
      const endDate = new Date(task.dateFinPrevue);
      const days = this.getDaysDifference(startDate, endDate) + 1;
      return `${days} jours`;
    } catch (error) {
      console.error('Erreur lors du calcul de la durée de la tâche:', error);
      return '-';
    }
  }

  
  getTaskColorByStatus(status: string): string {
    switch(status) {
      case 'TERMINE':
        return '#2196F3'; 
      case 'EN_COURS':
        return '#4CAF50'; 
      case 'EN_ATTENTE':
        return '#FF9800'; 
      default:
        return '#2196F3'; 
    }
  }
  
  
  resetAppMode(): void {
    this.errorMsg = undefined;
    this.showNotification('Tentative de connexion à l\'API...', 'info');
    
    
    if (this.selectedProjectId) {
      this.loadGanttTasks();
    }
  }
}
