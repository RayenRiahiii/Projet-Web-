import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '../../services/user.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-equipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipe.component.html',
  styleUrls: ['./equipe.component.css']
})
export class EquipeComponent implements OnInit {
  loading = true;
  search = '';
  availability: 'all' | 'available' | 'busy' = 'all';
  availableCount = 0;

  members: User[] = [];
  filtered: User[] = [];

  constructor(private userSvc: UserService) {}

  ngOnInit(): void {
    this.loadTeam();
  }

  trackById(_: number, user: User): number {
    return user.id;
  }

  loadTeam(): void {
    this.loading = true;
    this.userSvc.getAll().subscribe({
      next: (users) => {
        this.members = users.filter(u => u.role === UserRole.DEVELOPPEUR);
        this.availableCount = this.members.filter(m => m.disponibilite !== false).length;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement equipe', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.search.toLowerCase().trim();
    this.filtered = this.members.filter(user => {
      const matchesTerm =
        !term ||
        user.nom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesAvailability =
        this.availability === 'all' ||
        (this.availability === 'available' && user.disponibilite !== false) ||
        (this.availability === 'busy' && user.disponibilite === false);

      return matchesTerm && matchesAvailability;
    });
  }

  setAvailability(filter: 'all' | 'available' | 'busy'): void {
    this.availability = filter;
    this.applyFilters();
  }

  toggleAvailability(user: User): void {
    const nextValue = !user.disponibilite;
    this.userSvc.update(user.id, { disponibilite: nextValue }).subscribe({
      next: () => {
        user.disponibilite = nextValue;
        this.availableCount = this.members.filter(m => m.disponibilite !== false).length;
        this.applyFilters();
      },
      error: (err) => console.error('Erreur maj disponibilite', err)
    });
  }
}
