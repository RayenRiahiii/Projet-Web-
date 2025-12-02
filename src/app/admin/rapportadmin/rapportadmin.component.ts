import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { Report } from '../../models/report.models';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface JwtPayload {
  id: number;
  role: string;
  sub: string;
  iat: number;
  exp: number;
}

@Component({
  selector: 'app-rapportadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapportadmin.component.html',
  styleUrls: ['./rapportadmin.component.css']
})
export class RapportadminComponent implements OnInit, OnDestroy {
  
  currentUserId: number = 0;
  currentUserRole: string = '';

  
  reports: Report[] = [];
  filteredSentReports: Report[] = [];
  
  
  receivedReports: Report[] = [];
  filteredReceivedReports: Report[] = [];
  
  
  selectedReport: Report | null = null;
  safeReportUrl: SafeResourceUrl | null = null;
  
  
  searchTerm: string = '';
  receivedSearchTerm: string = '';
  
  
  currentSentPage: number = 1;
  pageSize: number = 10;
  totalSentPages: number = 1;
  
  
  currentReceivedPage: number = 1;
  totalReceivedPages: number = 1;

  
  loading: boolean = true;
  error: string | null = null;
  showUploadModal: boolean = false;
  showSendModal: boolean = false;
  
  
  managers: User[] = [];
  selectedManager: number | null = null;
  
  
  fileToUpload: File | null = null;
  uploadProjectId: number | null = null;
  allProjects: Project[] = [];
  
  
  private subscriptions: Subscription[] = [];

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private projectService: ProjectService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.reportService.closeWebSocket();
  }

  
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        this.currentUserId = decoded.id;
        this.currentUserRole = decoded.role;
        
        this.loadReports();
        this.loadManagers();
        this.loadAllProjects();
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT:', error);
        this.error = 'Problème d\'authentification. Veuillez vous reconnecter.';
      }
    } else {
      this.error = 'Utilisateur non authentifié. Veuillez vous connecter.';
    }
  }

  
  initWebSocket(): void {
    this.reportService.initWebSocket();
    
    
    const updatesSub = this.reportService.updates$.subscribe({
      next: (report: Report) => {
        
        this.loadReports();
      },
      error: (error) => {
        console.error('Erreur lors de la réception d\'une mise à jour de rapport:', error);
      }
    });
    
    this.subscriptions.push(updatesSub);
  }

  
  loadReports(): void {
    this.loading = true;
    
    
    const sentSub = this.reportService.getSentReports(this.currentUserId).subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredSentReports = [...reports];
        this.calculatePagination('sent');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rapports envoyés:', error);
        this.error = 'Erreur lors du chargement des rapports envoyés.';
        this.loading = false;
      }
    });
    this.subscriptions.push(sentSub);
    
    
    const receivedSub = this.reportService.getReceivedReports(this.currentUserId).subscribe({
      next: (reports) => {
        this.receivedReports = reports;
        this.filteredReceivedReports = [...reports];
        this.calculatePagination('received');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rapports reçus:', error);
        this.error = 'Erreur lors du chargement des rapports reçus.';
      }
    });
    this.subscriptions.push(receivedSub);
  }

  
  loadManagers(): void {
    const managersSub = this.reportService.getAllManagers().subscribe({
      next: (managers) => {
        this.managers = managers;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des managers:', error);
        this.error = 'Erreur lors du chargement des managers.';
      }
    });
    
    this.subscriptions.push(managersSub);
  }

  
  loadAllProjects(): void {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.allProjects = projects;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des projets:', error);
        this.error = 'Erreur lors du chargement des projets.';
      }
    });
  }

  
  selectReport(report: Report): void {
    this.selectedReport = report;
    const url = this.reportService.getFileUrl(report);
    this.safeReportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  
  openUploadModal(): void {
    this.showUploadModal = true;
    this.fileToUpload = null;
    this.uploadProjectId = null;
    
    
    if (this.allProjects.length === 0) {
      this.loadAllProjects();
    }
  }
  
  
  closeUploadModal(): void {
    this.showUploadModal = false;
  }

  
  openSendModal(report: Report): void {
    this.selectedReport = report;
    
    
    if (report.project) {
      const projectManager = this.getProjectManager(report.project.id);
      if (projectManager) {
        this.selectedManager = projectManager.id;
      } else {
        this.selectedManager = null;
        console.log('Aucun manager associé au projet:', report.project.nom);
      }
    } else {
      this.selectedManager = null;
    }
    
    this.showSendModal = true;
  }
  
  
  closeSendModal(): void {
    this.showSendModal = false;
  }

  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
      console.log('Fichier sélectionné:', this.fileToUpload.name);
    } else {
      console.log('Aucun fichier sélectionné');
    }
  }

  
  triggerFileInput(): void {
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  
  uploadReport(): void {
    if (!this.fileToUpload || !this.uploadProjectId) {
      this.error = 'Veuillez sélectionner un fichier et spécifier un projet.';
      return;
    }
    
    this.loading = true;
    
    const uploadSub = this.reportService.uploadReport(
      this.fileToUpload,
      this.uploadProjectId,
      this.currentUserId
    ).subscribe({
      next: (report) => {
        this.reports.unshift(report);
        this.filteredSentReports = [...this.reports];
        this.calculatePagination('sent');
        this.closeUploadModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du rapport:', error);
        this.error = 'Erreur lors du téléchargement du rapport.';
        this.loading = false;
      }
    });
    
    this.subscriptions.push(uploadSub);
  }

  
  sendReport(): void {
    if (!this.selectedReport || !this.selectedManager) {
      this.error = 'Veuillez sélectionner un manager pour envoyer le rapport.';
      return;
    }
    
    this.loading = true;
    
    const sendSub = this.reportService.sendReportAdminToManager(
      this.selectedReport.id,
      this.selectedManager
    ).subscribe({
      next: (report) => {
        
        const index = this.reports.findIndex(r => r.id === report.id);
        if (index !== -1) {
          this.reports[index] = report;
          this.filteredSentReports = [...this.reports];
        }
        
        this.closeSendModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du rapport:', error);
        this.error = 'Erreur lors de l\'envoi du rapport.';
        this.loading = false;
      }
    });
    
    this.subscriptions.push(sendSub);
  }

  
  deleteReport(reportId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }
    
    this.loading = true;
    
    const deleteSub = this.reportService.deleteReport(reportId).subscribe({
      next: () => {
        this.reports = this.reports.filter(r => r.id !== reportId);
        this.filteredSentReports = this.filteredSentReports.filter(r => r.id !== reportId);
        
        if (this.selectedReport && this.selectedReport.id === reportId) {
          this.selectedReport = null;
        }
        
        this.calculatePagination('sent');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du rapport:', error);
        this.error = 'Erreur lors de la suppression du rapport.';
        this.loading = false;
      }
    });
    
    this.subscriptions.push(deleteSub);
  }

  
  searchReports(type: 'sent' | 'received'): void {
    if (type === 'sent') {
      if (!this.searchTerm.trim()) {
        this.filteredSentReports = [...this.reports];
      } else {
        const term = this.searchTerm.toLowerCase().trim();
        this.filteredSentReports = this.reports.filter(report => 
          report.fileName.toLowerCase().includes(term) ||
          (report.project && report.project.nom.toLowerCase().includes(term)) ||
          (report.sender && report.sender.nom.toLowerCase().includes(term))
        );
      }
      this.calculatePagination('sent');
      this.currentSentPage = 1;
    } else {
      if (!this.receivedSearchTerm.trim()) {
        this.filteredReceivedReports = [...this.receivedReports];
      } else {
        const term = this.receivedSearchTerm.toLowerCase().trim();
        this.filteredReceivedReports = this.receivedReports.filter(report => 
          report.fileName.toLowerCase().includes(term) ||
          (report.project && report.project.nom.toLowerCase().includes(term)) ||
          (report.sender && report.sender.nom.toLowerCase().includes(term))
        );
      }
      this.calculatePagination('received');
      this.currentReceivedPage = 1;
    }
  }

  
  calculatePagination(type: 'sent' | 'received'): void {
    if (type === 'sent') {
      this.totalSentPages = Math.ceil(this.filteredSentReports.length / this.pageSize);
      if (this.currentSentPage > this.totalSentPages) {
        this.currentSentPage = Math.max(1, this.totalSentPages);
      }
    } else {
      this.totalReceivedPages = Math.ceil(this.filteredReceivedReports.length / this.pageSize);
      if (this.currentReceivedPage > this.totalReceivedPages) {
        this.currentReceivedPage = Math.max(1, this.totalReceivedPages);
      }
    }
  }
  
  goToPage(page: number, type: 'sent' | 'received'): void {
    if (type === 'sent' && page >= 1 && page <= this.totalSentPages) {
      this.currentSentPage = page;
    } else if (type === 'received' && page >= 1 && page <= this.totalReceivedPages) {
      this.currentReceivedPage = page;
    }
  }
  
  getCurrentPageItems(type: 'sent' | 'received'): Report[] {
    if (type === 'sent') {
      const startIndex = (this.currentSentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.filteredSentReports.slice(startIndex, endIndex);
    } else {
      const startIndex = (this.currentReceivedPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.filteredReceivedReports.slice(startIndex, endIndex);
    }
  }
  
  getPages(type: 'sent' | 'received'): number[] {
    if (type === 'sent') {
      return Array.from({ length: this.totalSentPages }, (_, i) => i + 1);
    } else {
      return Array.from({ length: this.totalReceivedPages }, (_, i) => i + 1);
    }
  }

  
  downloadReport(report: Report): void {
    const url = this.reportService.getFileUrl(report);
    window.open(url, '_blank');
  }

  
  getProjectManager(projectId: number | undefined): User | undefined {
    if (!projectId) return undefined;
    
    const project = this.allProjects.find(p => p.id === projectId);
    if (project?.manager?.id) {
      return this.managers.find(m => m.id === project.manager!.id);
    }
    return undefined;
  }

  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
