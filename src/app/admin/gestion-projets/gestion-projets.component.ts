import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Project, ProjectStatut, ProjectType, ProjectDto } from '../../models/project.model';
import { User, UserRole } from '../../models/user.model';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  id:   number;
  role: string;
  sub:  string;
  iat:  number;
  exp:  number;
}

@Component({
  selector: 'app-gestion-projets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './gestion-projets.component.html',
  styleUrl: './gestion-projets.component.css'
})
export class GestionProjetsComponent implements OnInit {
  
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  managers: User[] = [];

  //attributs de recherches
  searchTerm: string = '';
  showSearchCriteria: boolean = false;
  activeFilter: string = '';
  
  
  currentUserId?: number;
  currentUserRole?: string;

  //attributs pour la modification des projets
  showEditModal: boolean = false;
  editForm: FormGroup;

  selectedProjectId?: number;
  isSubmitting: boolean = false;
  errorMsg?: string;
  
  //attributs pour l ajout des projets
  showAddModal: boolean = false;
  addForm: FormGroup;
  
  
  showDetailsModal: boolean = false;
  selectedProject?: Project;
  
  
  successMsg?: string;
  
  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    //creation du formulaire de modification du projet
    this.editForm = this.fb.group({
      nom: ['', [Validators.required]],
      description: [''],
      dateDebut: [''],
      dateFinPrevue: ['', [Validators.required]],
      statut: ['EN_COURS'],
      type: ['SIMPLE'],
      managerId: [null, [Validators.required]]
    });
    
    //creation du formulaire de modification du projet
    this.addForm = this.fb.group({
      nom: ['', [Validators.required]],
      description: ['', [Validators.required]],
      dateDebut: [''],
      dateFinPrevue: ['', [Validators.required]],
      statut: ['EN_COURS'],
      type: ['SIMPLE'],
      managerId: [null, [Validators.required]]
    });
  }
  //charger les données necessaires
  ngOnInit(): void {
    this.loadUserInfo();
    this.loadProjects();
    this.loadManagers();
    
    
    this.updateProjectsStatus();
    
    this.scheduleStatusUpdate();
  }
  //infos utilisateurs(simulation de JWTOKEN)
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      this.currentUserId = decoded.id;
      this.currentUserRole = decoded.role;
    }
  }
  //charger les projets
  loadProjects(): void {
    
    this.projectService.getAll().subscribe({
      next: (data) => {
        console.log('Projets chargés depuis getAll():', data);
        this.projects = data;
        this.filteredProjects = [...this.projects];
        
        //pour assurer le chargement totales des infos de projets
        this.projects.forEach(project => {
          if (!project.manager || !project.manager.nom) {
            console.warn(`Projet ${project.id} - ${project.nom} n'a pas d'information manager complète, chargement des détails...`);
            this.projectService.getDetails(project.id).subscribe({
              next: (detailedProject) => {
                console.log(`Détails chargés pour le projet ${project.id}:`, detailedProject);
                
                const index = this.projects.findIndex(p => p.id === project.id);
                if (index !== -1) {
                  this.projects[index] = detailedProject;
                }
                const filteredIndex = this.filteredProjects.findIndex(p => p.id === project.id);
                if (filteredIndex !== -1) {
                  this.filteredProjects[filteredIndex] = detailedProject;
                }
              },
              error: (err) => console.error(`Erreur lors du chargement des détails du projet ${project.id}:`, err)
            });
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets:', err);
        this.errorMsg = "Impossible de charger les projets. Veuillez réessayer.";
      }
    });
  }
  //charger infos Managers
  loadManagers(): void {
  
    this.userService.getAll().subscribe({
      next: (users) => {
        this.managers = users.filter(user => user.role === UserRole.MANAGER);
        console.log('Managers chargés (' + this.managers.length + '):', this.managers);
        
        if (this.managers.length === 0) {
          this.managers = users.filter(user => user.role === 'MANAGER');
          console.log('Managers chargés après second filtrage (' + this.managers.length + '):', this.managers);
        }
      },
      error: (err) => console.error('Erreur lors du chargement des managers:', err)
    });
  }
  
  //PARTIE RECHERCHE
  searchProjects(): void {
    if (!this.searchTerm.trim()) {
      
      this.applyActiveFilter();
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      
      this.filteredProjects = this.filteredProjects.filter(project => 
        project.nom.toLowerCase().includes(term) || 
        (project.manager?.nom && project.manager.nom.toLowerCase().includes(term))
      );
    }
  }
  
  //afficher les critéres de recherche
  toggleSearchCriteria(): void {
    this.showSearchCriteria = !this.showSearchCriteria;
  }
  
  //par status
  filterByStatus(status: string): void {
    this.activeFilter = status;
    this.filteredProjects = this.projects.filter(project => project.statut === status);
    
    
    if (this.searchTerm.trim()) {
      this.searchProjects();
    }
  }
  
  //par type
  filterByType(type: string): void {
    this.activeFilter = type;
    this.filteredProjects = this.projects.filter(project => project.type === type);
    
    
    if (this.searchTerm.trim()) {
      this.searchProjects();
    }
  }
  
  //enlever les filtres
  resetFilters(): void {
    this.activeFilter = '';
    this.searchTerm = '';
    this.filteredProjects = [...this.projects];
  }
  
  //appliquer les filtres selectionnées
  private applyActiveFilter(): void {
    if (!this.activeFilter) {
      this.filteredProjects = [...this.projects];
    } else if (['EN_COURS', 'TERMINE', 'EN_ATTENTE'].includes(this.activeFilter)) {
      this.filteredProjects = this.projects.filter(project => project.statut === this.activeFilter);
    } else if (['SIMPLE', 'INTERMEDIAIRE', 'COMPLEXE'].includes(this.activeFilter)) {
      this.filteredProjects = this.projects.filter(project => project.type === this.activeFilter);
    }
  }
  
  // editeur de projet selectionné
  openEditModal(projectId: number): void {
    this.selectedProjectId = projectId;
    this.errorMsg = undefined;
    
    //extraire les infos du projets selectionné
    this.projectService.getById(projectId).subscribe({
      next: (project) => {
        
        this.editForm.patchValue({
          nom: project.nom,
          description: project.description || '',
          dateDebut: project.dateDebut ? project.dateDebut.substring(0, 10) : '',
          dateFinPrevue: project.dateFinPrevue ? project.dateFinPrevue.substring(0, 10) : '',
          statut: project.statut,
          type: project.type,
          managerId: project.manager?.id
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
  
  //fermer le edit du projet
  closeEditModal(event: Event): void {
    event.preventDefault();
    this.showEditModal = false;
    this.selectedProjectId = undefined;
    this.editForm.reset();
  }
  
  //valider form
  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.selectedProjectId) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMsg = undefined;
    
    const formData = this.editForm.value;
    console.log('Données du formulaire d\'édition brutes:', formData);
    
    
    if (!formData.managerId && formData.managerId !== 0) {
      this.errorMsg = "Le manager est obligatoire.";
      this.isSubmitting = false;
      return;
    }
    
    
    const dateError = this.validateProjectDates(formData.dateDebut, formData.dateFinPrevue);
    if (dateError) {
      this.errorMsg = dateError;
      this.isSubmitting = false;
      return;
    }
    
    
    const autoStatus = this.determineProjectStatus(formData.dateDebut, formData.dateFinPrevue);
    console.log(`Statut déterminé automatiquement pour la mise à jour: ${autoStatus}`);
    
    
    const managerId = Number(formData.managerId);
    console.log('Manager ID après conversion en nombre (édition):', managerId);
    
    if (isNaN(managerId)) {
      this.errorMsg = "ID du manager invalide.";
      this.isSubmitting = false;
      return;
    }
    
    
    const dateDebut = formData.dateDebut ? formData.dateDebut : undefined;
    const dateFinPrevue = formData.dateFinPrevue ? formData.dateFinPrevue : undefined;
    
    if (!dateFinPrevue) {
      this.errorMsg = "La date de fin prévue est obligatoire.";
      this.isSubmitting = false;
      return;
    }
    
    //date du projet dynamique avec verifications des dates
    const projectDto: ProjectDto = {
      nom: formData.nom,
      description: formData.description || '',
      dateDebut: dateDebut,
      dateFinPrevue: dateFinPrevue,
      statut: autoStatus as ProjectStatut, 
      type: formData.type,
      managerId: managerId 
    };
    
    console.log("Envoi des données pour mise à jour avec statut automatique:", projectDto);
    
    
    this.projectService.update(this.selectedProjectId, projectDto).subscribe({
      next: (updatedProject) => {
        console.log("Projet mis à jour avec succès:", updatedProject);
        
        
        this.loadProjects();
        
        
        this.successMsg = `Projet ${updatedProject.nom} mis à jour avec succès !`;
        
        
        this.showEditModal = false;
        this.editForm.reset();
        this.selectedProjectId = undefined;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur détaillée lors de la mise à jour du projet:', err);
        if (err.error && err.error.message) {
          this.errorMsg = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          this.errorMsg = err.error;
        } else {
          this.errorMsg = "Erreur lors de la mise à jour. Veuillez réessayer.";
        }
        this.isSubmitting = false;
      }
    });
  }
  
  //ouvrir fenetre d ajout de projet
  openAddModal(): void {
    this.errorMsg = undefined;
    this.addForm.reset({
      statut: 'EN_COURS',
      type: 'SIMPLE',
      description: ''
    });
    this.showAddModal = true;
  }
  
  //fermer la fenetre d ajout
  closeAddModal(event: Event): void {
    event.preventDefault();
    this.showAddModal = false;
    this.addForm.reset();
  }
  
  //submitter l ajout
  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = undefined;

    const formData = this.addForm.value;
    //verifier nom manager
    if (!formData.managerId && formData.managerId !== 0) {
      this.errorMsg = "Le manager est obligatoire.";
      this.isSubmitting = false;
      return;
    }
    //verifier la date
    const dateError = this.validateProjectDates(formData.dateDebut, formData.dateFinPrevue);
    if (dateError) {
      this.errorMsg = dateError;
      this.isSubmitting = false;
      return;
    }
    //verifier status
    const autoStatus = this.determineProjectStatus(formData.dateDebut, formData.dateFinPrevue);

    const managerId = Number(formData.managerId);
    if (isNaN(managerId)) {
      this.errorMsg = "ID du manager invalide.";
      this.isSubmitting = false;
      return;
    }
    //verifier le manager selectionné
    const selectedManager = this.managers.find(m => Number(m.id) === managerId);
    if (!selectedManager) {
      this.errorMsg = "Le manager selectionne est introuvable dans la liste des managers.";
      this.isSubmitting = false;
      return;
    }

    const projectDto: ProjectDto = {
      nom: formData.nom,
      description: formData.description || '',
      dateDebut: formData.dateDebut || undefined,
      dateFinPrevue: formData.dateFinPrevue,
      statut: autoStatus as ProjectStatut,
      type: formData.type as ProjectType,
      managerId: managerId
    };

    this.projectService.create(projectDto).subscribe({
      next: (newProject) => {
        this.loadProjects();
        this.successMsg = `Projet ${newProject.nom} cree avec succes !`;
        this.showAddModal = false;
        this.addForm.reset({
          statut: 'EN_COURS',
          type: 'SIMPLE',
          description: ''
        });
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMsg = "Erreur lors de la creation. Veuillez reessayer.";
        this.isSubmitting = false;
      }
    });
  }
  
  //afficher detailles de projets
  openDetailsModal(projectId: number): void {
    this.projectService.getDetails(projectId).subscribe({
      next: (project) => {
        this.selectedProject = project;
        this.showDetailsModal = true;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails du projet:', err);
      }
    });
  }
  
  //fermer detailles de projets
  closeDetailsModal(event: Event): void {
    event.preventDefault();
    this.showDetailsModal = false;
    this.selectedProject = undefined;
  }
  
  //suppression du projets
  deleteProject(projectId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet?')) {
      console.log(`Tentative de suppression du projet ID: ${projectId}`);
      
      this.projectService.delete(projectId).subscribe({
        next: () => {
          console.log(`Projet ID: ${projectId} supprimé avec succès`);
          
          this.projects = this.projects.filter(p => p.id !== projectId);
          this.filteredProjects = this.filteredProjects.filter(p => p.id !== projectId);
          
          
          this.successMsg = "Projet supprimé avec succès !";
        },
        error: (err) => {
          console.error(`Erreur lors de la suppression du projet ID: ${projectId}`, err);
          
          this.errorMsg = err.error?.message || "Erreur lors de la suppression du projet. Veuillez réessayer.";
        }
      });
    }
  }
  
  //avoir le status 
  getStatusClass(status: string): string {
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
  
  //contraintes des dates
  validateProjectDates(dateDebut: string | null, dateFinPrevue: string | null): string | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    if (dateDebut) {
      const debutDate = new Date(dateDebut);
      debutDate.setHours(0, 0, 0, 0);
      
      
      if (debutDate < today) {
        return "La date de début ne peut pas être antérieure à aujourd'hui";
      }
      
      
      if (dateFinPrevue) {
        const finDate = new Date(dateFinPrevue);
        finDate.setHours(0, 0, 0, 0);
        
        if (finDate <= debutDate) {
          return "La date de fin doit être postérieure à la date de début";
        }
      }
    }
    
    
    if (!dateDebut && dateFinPrevue) {
      const finDate = new Date(dateFinPrevue);
      finDate.setHours(0, 0, 0, 0);
      
      if (finDate <= today) {
        return "La date de fin doit être postérieure à aujourd'hui";
      }
    }
    
    return null; 
  }
  
 //changer status en fonction de date 
  determineProjectStatus(dateDebut: string | null, dateFinPrevue: string | null): ProjectStatut {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateDebut) {
      const debutDate = new Date(dateDebut);
      debutDate.setHours(0, 0, 0, 0);
      
      
      if (debutDate <= today) {
        
        if (dateFinPrevue) {
          const finDate = new Date(dateFinPrevue);
          finDate.setHours(0, 0, 0, 0);
          
          if (finDate < today) {
            return 'TERMINE'; 
          }
        }
        return 'EN_COURS'; 
      } else {
        return 'EN_ATTENTE'; 
      }
    }
    
    return 'EN_ATTENTE'; 
  }
  
  
  scheduleStatusUpdate(): void {
    
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    
    setTimeout(() => {
      this.updateProjectsStatus();
      
      this.scheduleStatusUpdate();
    }, timeUntilMidnight);
  }
  
  //maj des status en fonction du temps
  updateProjectsStatus(): void {
    const today = new Date().toISOString().split('T')[0];
    
    
    this.projects.forEach(project => {
      if (!project.dateDebut || !project.dateFinPrevue) return;
      
      const newStatus = this.determineProjectStatus(project.dateDebut, project.dateFinPrevue);
      
      
      if (project.statut !== newStatus) {
        console.log(`Mise à jour automatique du statut du projet ${project.id}: ${project.statut} -> ${newStatus}`);
        
        
        this.projectService.updateStatus(project.id, newStatus).subscribe({
          next: (updatedProject) => {
            console.log('Statut du projet mis à jour avec succès:', updatedProject);
            
            const index = this.projects.findIndex(p => p.id === project.id);
            if (index !== -1) {
              this.projects[index] = updatedProject;
            }
            const filteredIndex = this.filteredProjects.findIndex(p => p.id === project.id);
            if (filteredIndex !== -1) {
              this.filteredProjects[filteredIndex] = updatedProject;
            }
          },
          error: (err) => {
            console.error(`Erreur lors de la mise à jour du statut du projet ${project.id}:`, err);
          }
        });
      }
    });
  }
}
