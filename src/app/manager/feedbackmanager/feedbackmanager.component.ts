import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Project } from '../../models/project.model';
import { User, UserRole } from '../../models/user.model';
import { DeveloperFeedback, FeedbackForm } from '../../models/feedback.models';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';

interface JwtPayload {
  id: number;
  role: string;
  sub: string;
}

@Component({
  selector: 'app-feedbackmanager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedbackmanager.component.html',
  styleUrls: ['./feedbackmanager.component.css']
})
export class FeedbackManagerComponent implements OnInit, OnDestroy {
  
  currentManagerId: number = 0;
  
  
  managerProjects: Project[] = [];
  projectDevelopers: User[] = [];
  
  
  selectedProjectId: number | null = null;
  selectedDeveloperId: number | null = null;
  
  
  feedbackForm: FeedbackForm = {
    qualiteCode: 4,
    respectDelais: 4,
    travailEquipe: 4,
    autonomie: 4,
    commentaire: ''
  };
  
  
  projectFeedbacks: DeveloperFeedback[] = [];
  
  
  loading: boolean = false;
  success: string | null = null;
  error: string | null = null;
  
  
  developerAlreadyRated: boolean = false;
  existingFeedback: DeveloperFeedback | null = null;
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private feedbackService: FeedbackService,
    private projectService: ProjectService,
    private authService: AuthService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    
    const role = this.authService.getRole();
    console.log('User role:', role);
    
    if (role !== 'MANAGER') {
      this.error = 'Vous devez être connecté en tant que Manager pour accéder à cette fonctionnalité.';
      return;
    }
    
    this.getManagerIdFromToken();
  }
  
  ngOnDestroy(): void {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(sub => {
        if (sub) sub.unsubscribe();
      });
    }
  }
  
  
  getManagerIdFromToken(): void {
    try {
      const token = this.authService.getToken();
      if (!token) {
        this.error = 'Utilisateur non authentifié. Veuillez vous connecter.';
        return;
      }
      
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded || !decoded.id) {
        this.error = 'Token invalide. Veuillez vous reconnecter.';
        return;
      }
      
      this.currentManagerId = decoded.id;
      this.loadManagerProjects();
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      this.error = 'Problème d\'authentification. Veuillez vous reconnecter.';
    }
  }
  
  
  loadManagerProjects(): void {
    if (!this.currentManagerId) {
      this.error = 'ID manager non disponible.';
      return;
    }
    
    this.loading = true;
    const sub = this.projectService.getByManager(this.currentManagerId).subscribe({
      next: (projects) => {
        this.managerProjects = projects || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading manager projects:', err);
        this.error = 'Erreur lors du chargement des projets.';
        this.loading = false;
      }
    });
    
    if (sub) {
      this.subscriptions.push(sub);
    }
  }
  
  
  onProjectSelected(): void {
    if (!this.selectedProjectId) {
      return;
    }
    
    this.loading = true;
    this.projectDevelopers = [];
    this.selectedDeveloperId = null;
    this.developerAlreadyRated = false;
    this.existingFeedback = null;
    this.resetFeedbackForm();
    
    
    const projectSub = this.projectService.getDetails(this.selectedProjectId).subscribe({
      next: (project) => {
        console.log('Project details received:', project);
        
        if (project && project.assignedDevelopers && project.assignedDevelopers.length > 0) {
          console.log('Project developers:', project.assignedDevelopers);
          
          this.projectDevelopers = project.assignedDevelopers.map(dev => ({
            id: dev.id,
            nom: dev.nom || 'Sans nom',
            email: '',
            role: UserRole.DEVELOPPEUR
          }));
          console.log('Mapped developers:', this.projectDevelopers);
        } else {
          console.log('No developers found in project data');
          this.loadDevelopersByProjectId();
        }
        
        
        this.loadProjectFeedbacks();
      },
      error: (err) => {
        console.error('Error loading project details:', err);
        this.error = 'Erreur lors du chargement des détails du projet.';
        this.loading = false;
      }
    });
    
    if (projectSub) {
      this.subscriptions.push(projectSub);
    }
  }
  
  
  loadDevelopersByProjectId(): void {
    if (!this.selectedProjectId) {
      this.loading = false;
      return;
    }
    
    
    this.userService.getAll().subscribe({
      next: (users) => {
        const developers = users.filter(u => u.role === UserRole.DEVELOPPEUR);
        console.log('All developers found:', developers);
        this.projectDevelopers = developers;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading developers:', err);
        this.error = 'Erreur lors du chargement des développeurs.';
        this.loading = false;
      }
    });
  }
  
  
  loadProjectFeedbacks(): void {
    if (!this.selectedProjectId) {
      this.loading = false;
      return;
    }
    
    const feedbackSub = this.feedbackService.getFeedbacksByProject(this.selectedProjectId).subscribe({
      next: (feedbacks) => {
        this.projectFeedbacks = feedbacks || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project feedbacks:', err);
        this.error = 'Erreur lors du chargement des évaluations.';
        this.loading = false;
        this.projectFeedbacks = [];
      }
    });
    
    if (feedbackSub) {
      this.subscriptions.push(feedbackSub);
    }
  }
  
  
  onDeveloperSelected(): void {
    if (!this.selectedProjectId || !this.selectedDeveloperId) {
      return;
    }
    
    this.loading = true;
    this.resetFeedbackForm();
    
    
    const checkSub = this.feedbackService.hasBeenNoted(this.selectedProjectId, this.selectedDeveloperId).subscribe({
      next: (hasBeenNoted) => {
        this.developerAlreadyRated = !!hasBeenNoted;
        
        if (this.developerAlreadyRated) {
          
          this.loadExistingFeedback();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error checking if developer has been rated:', err);
        this.error = 'Erreur lors de la vérification des évaluations existantes.';
        this.loading = false;
      }
    });
    
    if (checkSub) {
      this.subscriptions.push(checkSub);
    }
  }
  
  
  loadExistingFeedback(): void {
    if (!this.selectedProjectId || !this.selectedDeveloperId) {
      this.loading = false;
      return;
    }
    
    const feedbackSub = this.feedbackService.getFeedbackForProjectAndDeveloper(
      this.selectedProjectId, 
      this.selectedDeveloperId
    ).subscribe({
      next: (feedback) => {
        if (feedback) {
          this.existingFeedback = feedback;
          this.feedbackForm = {
            qualiteCode: feedback.qualiteCode || 4,
            respectDelais: feedback.respectDelais || 4,
            travailEquipe: feedback.travailEquipe || 4,
            autonomie: feedback.autonomie || 4,
            commentaire: feedback.commentaire || ''
          };
        } else {
          this.existingFeedback = null;
          this.resetFeedbackForm();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading existing feedback:', err);
        this.error = 'Erreur lors du chargement de l\'évaluation existante.';
        this.loading = false;
      }
    });
    
    if (feedbackSub) {
      this.subscriptions.push(feedbackSub);
    }
  }
  
  
  submitFeedback(): void {
    if (!this.selectedProjectId || !this.selectedDeveloperId) {
      this.error = 'Veuillez sélectionner un projet et un développeur.';
      return;
    }
    
    
    const role = this.authService.getRole();
    const token = this.authService.getToken();
    const managerId = this.authService.getUserId();
    
    console.log('⚠️ Tentative de création feedback:');
    console.log('- Role utilisateur:', role);
    console.log('- Token présent:', !!token);
    console.log('- Manager ID:', managerId);
    console.log('- Projet ID:', this.selectedProjectId);
    console.log('- Développeur ID:', this.selectedDeveloperId);
    
    if (role !== 'MANAGER') {
      this.error = 'Vous devez être un manager pour évaluer un développeur.';
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    const formToSubmit: FeedbackForm = {
      qualiteCode: this.feedbackForm.qualiteCode || 1,
      respectDelais: this.feedbackForm.respectDelais || 1,
      travailEquipe: this.feedbackForm.travailEquipe || 1, 
      autonomie: this.feedbackForm.autonomie || 1,
      commentaire: this.feedbackForm.commentaire || ''
    };
    
    let feedbackSub;
    
    if (this.developerAlreadyRated) {
      
      feedbackSub = this.feedbackService.modifyFeedback(
        this.selectedProjectId,
        this.selectedDeveloperId,
        formToSubmit
      ).subscribe({
        next: (feedback) => {
          if (feedback) {
            this.success = 'Évaluation mise à jour avec succès!';
            this.existingFeedback = feedback;
            this.loadProjectFeedbacks();
          } else {
            this.error = 'Erreur: réponse vide du serveur.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error updating feedback:', err);
          this.error = `Erreur lors de la mise à jour de l'évaluation: ${err.status} ${err.statusText}`;
          if (err.error && typeof err.error === 'string') {
            this.error += ` - ${err.error}`;
          }
          this.loading = false;
        }
      });
    } else {
      
      feedbackSub = this.feedbackService.giveFeedback(
        this.selectedProjectId,
        this.selectedDeveloperId,
        formToSubmit
      ).subscribe({
        next: (feedback) => {
          if (feedback) {
            this.success = 'Évaluation créée avec succès!';
            this.existingFeedback = feedback;
            this.developerAlreadyRated = true;
            this.loadProjectFeedbacks();
          } else {
            this.error = 'Erreur: réponse vide du serveur.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creating feedback:', err);
          this.error = `Erreur lors de la création de l'évaluation: ${err.status} ${err.statusText}`;
          if (err.error && typeof err.error === 'string') {
            this.error += ` - ${err.error}`;
          }
          this.loading = false;
        }
      });
    }
    
    if (feedbackSub) {
      this.subscriptions.push(feedbackSub);
    }
  }
  
  
  resetFeedbackForm(): void {
    this.feedbackForm = {
      qualiteCode: 4,
      respectDelais: 4,
      travailEquipe: 4,
      autonomie: 4,
      commentaire: ''
    };
    this.existingFeedback = null;
  }
  
  
  getDeveloperNameById(id: number | null | undefined): string {
    if (!id) {
      return 'ID manquant';
    }
    
    
    if (this.projectDevelopers && this.projectDevelopers.length > 0) {
      const developer = this.projectDevelopers.find(dev => dev && dev.id === id);
      if (developer) {
        return developer.nom || 'Sans nom';
      }
    }
    
    
    const feedback = this.projectFeedbacks.find(fb => fb.developer?.id === id);
    if (feedback && feedback.developer && feedback.developer.nom) {
      return feedback.developer.nom;
    }
    
    return 'Développeur #' + id;
  }
  
  
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }
  
  
  getScoreDisplay(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'N/A';
    try {
      return score.toFixed(1);
    } catch (error) {
      return 'N/A';
    }
  }
}
