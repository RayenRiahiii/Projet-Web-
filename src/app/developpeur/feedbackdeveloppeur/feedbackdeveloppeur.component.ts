import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { DeveloperFeedback } from '../../models/feedback.models';
import { Project } from '../../models/project.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feedbackdeveloppeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedbackdeveloppeur.component.html',
  styleUrl: './feedbackdeveloppeur.component.css'
})
export class FeedbackdeveloppeurComponent implements OnInit, OnDestroy {
  
  currentUserId: number = 0;
  
  
  loading: boolean = true;
  error: string | null = null;
  
  
  developerFeedbacks: DeveloperFeedback[] = [];
  recentFeedbacks: DeveloperFeedback[] = [];
  
  
  projectsWithoutFeedback: Project[] = [];
  
  
  totalPoints: number = 0;
  completedProjectsCount: number = 0;
  progressPercentage: number = 0;
  
  
  searchTerm: string = '';
  sortBy: string = 'date';
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private feedbackService: FeedbackService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.getUserIdFromToken();
  }
  
  ngOnDestroy(): void {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(sub => {
        if (sub) sub.unsubscribe();
      });
    }
  }
  
  
  getUserIdFromToken(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.error = 'Utilisateur non authentifié. Veuillez vous connecter.';
        this.loading = false;
        return;
      }
      
      this.currentUserId = userId;
      this.loadDeveloperData();
    } catch (error) {
      console.error('Error getting user ID:', error);
      this.error = 'Problème d\'authentification. Veuillez vous reconnecter.';
      this.loading = false;
    }
  }
  
  
  loadDeveloperData(): void {
    if (!this.currentUserId) {
      this.loading = false;
      return;
    }
    
    
    const pointsSub = this.feedbackService.getTotalPoints(this.currentUserId).subscribe({
      next: (points) => {
        this.totalPoints = points || 0;
      },
      error: (err) => {
        console.error('Error loading total points:', err);
      }
    });
    
    if (pointsSub) {
      this.subscriptions.push(pointsSub);
    }
    
    
    const feedbackSub = this.feedbackService.getFeedbacksByDeveloper(this.currentUserId).subscribe({
      next: (feedbacks) => {
        this.developerFeedbacks = feedbacks || [];
        this.completedProjectsCount = this.developerFeedbacks.length;
        
        
        this.recentFeedbacks = [...this.developerFeedbacks]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        
        
        this.calculateProgress();
      },
      error: (err) => {
        console.error('Error loading developer feedbacks:', err);
        this.error = 'Erreur lors du chargement des évaluations.';
      }
    });
    
    if (feedbackSub) {
      this.subscriptions.push(feedbackSub);
    }
    
    
    const projectsWithoutFeedbackSub = this.feedbackService.getProjectsWithoutFeedback(this.currentUserId).subscribe({
      next: (projects) => {
        this.projectsWithoutFeedback = projects || [];
        this.calculateProgress();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading projects without feedback:', err);
        this.error = 'Erreur lors du chargement des projets en attente d\'évaluation.';
        this.loading = false;
      }
    });
    
    if (projectsWithoutFeedbackSub) {
      this.subscriptions.push(projectsWithoutFeedbackSub);
    }
    
    
    this.setupWebSocketConnection();
  }
  
  
  setupWebSocketConnection(): void {
    
    const projectIds = this.projectsWithoutFeedback.map(p => p.id);
    
    this.developerFeedbacks.forEach(fb => {
      if (fb.project && fb.project.id && !projectIds.includes(fb.project.id)) {
        projectIds.push(fb.project.id);
      }
    });
    
    
    if (projectIds.length > 0) {
      this.feedbackService.initWebSocket(projectIds);
      
      
      const personalStreamSub = this.feedbackService.personalStream$.subscribe(newFeedback => {
        
        this.handleNewFeedback(newFeedback);
      });
      
      if (personalStreamSub) {
        this.subscriptions.push(personalStreamSub);
      }
    }
  }
  
  
  handleNewFeedback(feedback: DeveloperFeedback): void {
    
    const existingIndex = this.developerFeedbacks.findIndex(fb => 
      fb.project.id === feedback.project.id && fb.developer.id === feedback.developer.id);
    
    if (existingIndex >= 0) {
      
      this.developerFeedbacks[existingIndex] = feedback;
    } else {
      
      this.developerFeedbacks.push(feedback);
      this.completedProjectsCount++;
      
      
      const pendingIndex = this.projectsWithoutFeedback.findIndex(p => p.id === feedback.project.id);
      if (pendingIndex >= 0) {
        this.projectsWithoutFeedback.splice(pendingIndex, 1);
      }
    }
    
    
    this.recentFeedbacks = [...this.developerFeedbacks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    
    this.calculateProgress();
  }
  
  
  calculateProgress(): void {
    const totalProjects = this.completedProjectsCount + this.projectsWithoutFeedback.length;
    if (totalProjects > 0) {
      this.progressPercentage = Math.round((this.completedProjectsCount / totalProjects) * 100);
    } else {
      this.progressPercentage = 0;
    }
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
    return score.toFixed(1);
  }
}
