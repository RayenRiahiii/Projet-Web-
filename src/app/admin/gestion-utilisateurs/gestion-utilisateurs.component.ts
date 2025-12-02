import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole, UserCreate } from '../../models/user.model';

interface JwtPayload {
  id:   number;
  role: string;
  sub:  string;
  iat:  number;
  exp:  number;
}

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrl: './gestion-utilisateurs.component.css'
})
export class GestionUtilisateursComponent implements OnInit {
  
  users: User[] = [];
  filteredUsers: User[] = [];
  
  
  searchTerm: string = '';
  
  
  showSearchCriteria: boolean = false;
  activeFilter: string = ''; 
  
  
  currentUserId?: number;
  currentUserRole?: string;

  
  showEditModal: boolean = false;
  editForm: FormGroup;
  selectedUserId?: number;
  isSubmitting: boolean = false;
  errorMsg?: string;
  
  
  showDetailsModal: boolean = false;
  selectedUser?: User;
  
  
  showAddModal: boolean = false;
  addForm: FormGroup;
  
  
  successMsg?: string;
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    
    this.editForm = this.fb.group({
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      competences: [''],
      experiences: [0],
      disponibilite: [true]
    });
    
    
    this.addForm = this.fb.group({
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['DEVELOPPEUR', [Validators.required]],
      competences: [''],
      experiences: [0],
      disponibilite: [true]
    });
  }
  
  ngOnInit(): void {
    this.loadUserInfo();
    this.loadUsers();
  }
  
  loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      this.currentUserId = decoded.id;
      this.currentUserRole = decoded.role;
    }
  }
  
  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        
        this.users = users.filter(user => user.id !== this.currentUserId);
        this.filteredUsers = [...this.users];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        
        for (let i = 1; i <= 10; i++) {
          
          if (i === this.currentUserId) continue;
          
          this.userService.getById(i).subscribe({
            next: (user) => {
              this.users.push(user);
              this.filteredUsers = [...this.users];
            },
            error: () => {} 
          });
        }
      }
    });
  }
  
  
  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      
      this.applyActiveFilter();
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      
      this.filteredUsers = this.filteredUsers.filter(user => 
        user.nom.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        user.id.toString().includes(term)
      );
    }
  }
  
  
  toggleSearchCriteria(): void {
    this.showSearchCriteria = !this.showSearchCriteria;
  }
  
  
  filterByRole(role: string): void {
    this.activeFilter = role;
    this.filteredUsers = this.users.filter(user => user.role === role);
    
    
    if (this.searchTerm.trim()) {
      this.searchUsers();
    }
  }
  
  
  filterByAvailability(isAvailable: boolean): void {
    this.activeFilter = isAvailable ? 'disponible' : 'indisponible';
    this.filteredUsers = this.users.filter(user => user.disponibilite === isAvailable);
    
    
    if (this.searchTerm.trim()) {
      this.searchUsers();
    }
  }
  
  
  resetFilters(): void {
    this.activeFilter = '';
    this.searchTerm = '';
    this.filteredUsers = [...this.users];
  }
  
  
  private applyActiveFilter(): void {
    if (!this.activeFilter) {
      this.filteredUsers = [...this.users];
    } else if (['DEVELOPPEUR', 'MANAGER', 'ADMIN'].includes(this.activeFilter)) {
      this.filteredUsers = this.users.filter(user => user.role === this.activeFilter);
    } else if (this.activeFilter === 'disponible' || this.activeFilter === 'indisponible') {
      this.filterByAvailability(this.activeFilter === 'disponible');
    }
  }
  
  
  openEditModal(userId: number): void {
    this.selectedUserId = userId;
    this.errorMsg = undefined;
    
    
    this.userService.getById(userId).subscribe({
      next: (user) => {
        
        this.editForm.patchValue({
          nom: user.nom,
          email: user.email,
          role: user.role,
          competences: user.competences || '',
          experiences: user.experiences || 0,
          disponibilite: user.disponibilite || false
        });
        
        
        this.editForm.markAsPristine();
        this.editForm.markAsUntouched();
        
        
        this.showEditModal = true;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails de l\'utilisateur:', err);
        this.errorMsg = "Impossible de charger les détails de l'utilisateur. Veuillez réessayer.";
      }
    });
  }
  
  
  closeEditModal(event: Event): void {
    event.preventDefault();
    this.showEditModal = false;
    this.selectedUserId = undefined;
    this.editForm.reset();
  }
  
  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.selectedUserId) return;
    
    
    const userId = this.selectedUserId;
    
    this.isSubmitting=true;
    this.errorMsg=undefined;
    const formData=this.editForm.value;
    
    
    const userUpdate: Partial<User>={
      nom: formData.nom,
      email: formData.email,
      role: formData.role,
      competences: formData.competences || '',
      experiences: formData.experiences || 0,
      disponibilite: formData.disponibilite
    };
    
    
    this.userService.getById(userId).subscribe({
      next: (currentUser) => {
        
        userUpdate.motDePasse = currentUser.motDePasse;
        userUpdate.pointsTotal = currentUser.pointsTotal;
        userUpdate.photo = currentUser.photo;
        
        
        this.userService.update(userId, userUpdate).subscribe({
      next:(updated)=>{
        this.users=this.users.map(u=>u.id===updated.id?updated:u);
        this.filteredUsers=this.filteredUsers.map(u=>u.id===updated.id?updated:u);
        this.showEditModal=false;
        this.editForm.reset();
        this.selectedUserId=undefined;
        this.isSubmitting=false;
            this.successMsg = `Utilisateur ${updated.nom} modifié avec succès!`;
      },
      error:(err)=>{
        console.error('Erreur lors de la mise à jour:',err);
        this.errorMsg=err.error?.message||'Erreur lors de la mise à jour. Veuillez réessayer.';
            this.isSubmitting=false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des informations actuelles:',err);
        this.errorMsg='Erreur lors de la récupération des informations actuelles.';
        this.isSubmitting=false;
      }
    });
  }
  
  openAddModal(): void {
    this.errorMsg=undefined;
    this.addForm.reset({role:'DEVELOPPEUR',experiences:0,disponibilite:true});
    this.showAddModal=true;
  }
 
  
  closeAddModal(event: Event): void {
    event.preventDefault();
    this.showAddModal = false;
    this.addForm.reset();
  }
  
  
  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMsg = undefined;
    this.successMsg = undefined;
    
    const formData = this.addForm.value;
    
    
    const userData: UserCreate = {
      nom          : formData.nom,
      email        : formData.email,
      motDePasse   : formData.password,
      role         : formData.role,
      competences  : formData.competences,
      experiences  : formData.experiences || 0,
      disponibilite: formData.disponibilite
    };
    
    console.log('Envoi des données pour enregistrement:', userData);
    
    
    this.userService.create(userData).subscribe({
      next: () => {
        console.log('Utilisateur créé avec succès');
        
        
        this.loadUsers();
        
        
        this.successMsg = `Utilisateur ${userData.nom} créé avec succès!`;
        
        
        this.showAddModal = false;
        this.addForm.reset({
          role: 'DEVELOPPEUR',
          experiences: 0,
          disponibilite: true
        });
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur détaillée:', err);
        if (err.error) {
          console.error('Détails de l\'erreur:', err.error);
        }
        this.errorMsg = err.error?.message || "Erreur lors de l'ajout. Veuillez réessayer.";
        this.isSubmitting = false;
      }
    });
  }
  
  
  openDetailsModal(userId: number): void {
    this.userService.getById(userId).subscribe({
      next: (user) => {
        this.selectedUser = user;
        this.showDetailsModal = true;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails de l\'utilisateur:', err);
      }
    });
  }
  
  
  closeDetailsModal(event: Event): void {
    event.preventDefault();
    this.showDetailsModal = false;
    this.selectedUser = undefined;
  }
  
  
  deleteUser(userId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      this.userService.delete(userId).subscribe({
        next: () => {
          
          this.users = this.users.filter(u => u.id !== userId);
          this.filteredUsers = this.filteredUsers.filter(u => u.id !== userId);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'utilisateur:', err);
          alert('Erreur lors de la suppression de l\'utilisateur. Veuillez réessayer.');
        }
      });
    }
  }
  
  
  toggleEditDisponibilite(): void {
    const currentValue = this.editForm.get('disponibilite')?.value;
    this.editForm.get('disponibilite')?.setValue(!currentValue);
  }
  
  
  toggleAddDisponibilite(): void {
    const currentValue = this.addForm.get('disponibilite')?.value;
    this.addForm.get('disponibilite')?.setValue(!currentValue);
  }
  
  
  getUserPhotoUrl(photoFileName?: string): string {
    return this.userService.photoUrl(photoFileName);
  }
}
