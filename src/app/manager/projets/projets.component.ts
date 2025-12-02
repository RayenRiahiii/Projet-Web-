import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project, ProjectStatut, ProjectDto } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../../services/auth.service';

interface JwtPayload {
  id:   number;
  role: string;
  sub:  string;
  iat:  number;
  exp:  number;
}

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.css'
})
export class ProjetsComponent implements OnInit {
  
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  
  
  searchTerm: string = '';
  
  
  showSearchCriteria: boolean = false;
  activeFilter: string = ''; 
  
  
  userId?: number;
  userRole?: string;

  
  showEditModal: boolean = false;
  editForm: FormGroup;
  currentProjectId?: number;
  isSubmitting: boolean = false;
  errorMsg?: string;
  
  
  showDetailsModal: boolean = false;
  currentProject?: Project;
  projectTasks: Task[] = [];
  loadingTasks: boolean = false;
  
  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      nom: ['', [Validators.required]],
      description: [''],
      dateDebut: [''],
      dateFinPrevue: [''],
      statut: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadUserInfo();
    this.loadProjects();
  }
  
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      this.userId = decoded.id;
      this.userRole = decoded.role;
    }
  }
  
  loadProjects(): void {
    if (this.userRole === 'MANAGER' && this.userId) {
      
      this.projectService.getByManager(this.userId).subscribe({
        next: (data) => {
          this.projects = data;
          this.filteredProjects = [...this.projects];
        },
        error: (err) => console.error('Erreur lors du chargement des projets:', err)
      });
    } else {
      
      this.projectService.getAllDetails().subscribe({
        next: (data) => {
          this.projects = data;
          this.filteredProjects = [...this.projects];
        },
        error: (err) => console.error('Erreur lors du chargement des projets:', err)
      });
    }
  }
  
  
  searchProjects(): void {
    if (!this.searchTerm.trim()) {
      
      this.applyActiveFilter();
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      
      this.filteredProjects = this.filteredProjects.filter(project => 
        project.nom.toLowerCase().includes(term) || 
        project.id.toString().includes(term)
      );
    }
  }
  
  
  toggleSearchCriteria(): void {
    this.showSearchCriteria = !this.showSearchCriteria;
  }
  
  
  filterByStatus(status: string): void {
    this.activeFilter = status;
    this.filteredProjects = this.projects.filter(project => project.statut === status);
    
    
    if (this.searchTerm.trim()) {
      this.searchProjects();
    }
  }
  
  
  filterByDate(dateType: string): void {
    this.activeFilter = dateType;
    const today = new Date();
    
    if (dateType === 'recent') {
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      this.filteredProjects = this.projects.filter(project => {
        if (!project.dateDebut) return false;
        const startDate = new Date(project.dateDebut);
        return startDate >= thirtyDaysAgo && startDate <= today;
      });
    } 
    else if (dateType === 'upcoming') {
      
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      this.filteredProjects = this.projects.filter(project => {
        if (!project.dateDebut) return false;
        const startDate = new Date(project.dateDebut);
        return startDate > today && startDate <= thirtyDaysLater;
      });
    }
    
    
    if (this.searchTerm.trim()) {
      this.searchProjects();
    }
  }
  
  
  resetFilters(): void {
    this.activeFilter = '';
    this.searchTerm = '';
    this.filteredProjects = [...this.projects];
  }
  
  
  private applyActiveFilter(): void {
    if (!this.activeFilter) {
      this.filteredProjects = [...this.projects];
    } else if (['EN_COURS', 'TERMINE', 'EN_ATTENTE'].includes(this.activeFilter)) {
      this.filteredProjects = this.projects.filter(project => project.statut === this.activeFilter);
    } else if (this.activeFilter === 'recent' || this.activeFilter === 'upcoming') {
      this.filterByDate(this.activeFilter);
    }
  }
  
  
  openEditModal(projectId: number): void {
    this.currentProjectId = projectId;
    this.errorMsg = undefined;
    
    
    this.projectService.getById(projectId).subscribe({
      next: (project) => {
        
        this.editForm.patchValue({
          nom: project.nom,
          description: project.description || '',
          dateDebut: project.dateDebut ? project.dateDebut.substring(0, 10) : '',
          dateFinPrevue: project.dateFinPrevue ? project.dateFinPrevue.substring(0, 10) : '',
          statut: project.statut
        });
        
        
        this.editForm.markAsPristine();
        this.editForm.markAsUntouched();
        
        
        this.showEditModal = true;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails du projet:', err);
        this.errorMsg = "Impossible de charger les détails du projet. Veuillez réessayer.";
      }
    });
  }
  
  
  closeEditModal(event: Event): void {
    event.preventDefault();
    this.showEditModal = false;
    this.currentProjectId = undefined;
    this.editForm.reset();
  }
  
  
  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.currentProjectId) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMsg = undefined;
    
    const formData = this.editForm.value;
    
    
    const projectDto: ProjectDto = {
      nom: formData.nom,
      description: formData.description || undefined,
      dateDebut: formData.dateDebut || undefined,
      dateFinPrevue: formData.dateFinPrevue || undefined,
      statut: formData.statut as ProjectStatut,
      type: this.getProjectType(this.currentProjectId), 
      managerId: this.getProjectManagerId(this.currentProjectId) 
    };
    
    
    this.projectService.update(this.currentProjectId, projectDto).subscribe({
      next: (updatedProject) => {
        
        this.projects = this.projects.map(p => 
          p.id === this.currentProjectId ? updatedProject : p
        );
        
        
        this.filteredProjects = this.filteredProjects.map(p => 
          p.id === this.currentProjectId ? updatedProject : p
        );
        
        
        this.showEditModal = false;
        this.editForm.reset();
        this.currentProjectId = undefined;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du projet:', err);
        this.errorMsg = "Erreur lors de la mise à jour. Veuillez réessayer.";
        this.isSubmitting = false;
      }
    });
  }
  
  
  private getProjectType(projectId: number): any {
    const project = this.projects.find(p => p.id === projectId);
    return project?.type || 'SIMPLE';
  }
  
  
  private getProjectManagerId(projectId: number): number {
    const project = this.projects.find(p => p.id === projectId);
    return project?.manager?.id || this.userId || 0;
  }
  
  getStatusClass(status: ProjectStatut): string {
    switch (status) {
      case 'EN_COURS':
        return 'status-in-progress';
      case 'TERMINE':
        return 'status-completed';
      case 'EN_ATTENTE':
        return 'status-pending';
      default:
        return '';
    }
  }
  
  
  openDetailsModal(projectId: number): void {
    this.loadingTasks = true;
    
    
    this.projectService.getDetails(projectId).subscribe({
      next: (project) => {
        this.currentProject = project;
        this.showDetailsModal = true;
        
        
        this.taskService.getByProject(projectId).subscribe({
          next: (tasks) => {
            this.projectTasks = tasks;
            this.loadingTasks = false;
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des tâches:', err);
            this.loadingTasks = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails du projet:', err);
      }
    });
  }
  
  
  getProjectProgressPercentage(): number {
    if (!this.projectTasks || this.projectTasks.length === 0) {
      return 0;
    }
    
    
    const completedTasks = this.projectTasks.filter(task => task.statut === 'TERMINEE').length;
    let percentage = Math.round((completedTasks / this.projectTasks.length) * 100);
    
    
    if (this.projectTasks.some(task => task.avancement !== undefined)) {
      const totalTasks = this.projectTasks.length;
      let totalProgress = this.projectTasks.reduce((sum, task) => {
        if (task.statut === 'TERMINEE') {
          return sum + 100;
        } else if (task.avancement !== undefined) {
          return sum + task.avancement;
        }
        return sum;
      }, 0);
      
      percentage = Math.round(totalProgress / totalTasks);
    }
    
    return Math.min(100, Math.max(0, percentage));
  }
  
  
  getProjectDuration(): number {
    if (!this.currentProject || !this.currentProject.dateDebut || !this.currentProject.dateFinPrevue) {
      return 0;
    }
    
    const startDate = new Date(this.currentProject.dateDebut);
    const endDate = new Date(this.currentProject.dateFinPrevue);
    
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  
  isDateUrgent(dateStr?: string): boolean {
    if (!dateStr) return false;
    
    const taskDate = new Date(dateStr);
    const today = new Date();
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 3;
  }
  
  
  closeDetailsModal(event: Event): void {
    event.preventDefault();
    this.showDetailsModal = false;
    this.currentProject = undefined;
    this.projectTasks = [];
  }
}
