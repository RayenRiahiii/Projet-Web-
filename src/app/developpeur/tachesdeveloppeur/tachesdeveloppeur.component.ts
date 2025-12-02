import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task.model';

type TaskFilter = 'ALL' | 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';

@Component({
  selector: 'app-tachesdeveloppeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tachesdeveloppeur.component.html',
  styleUrls: ['./tachesdeveloppeur.component.css']
})
export class TachesdeveloppeurComponent implements OnInit {
  loading = true;
  developerId!: number;

  tasks: Task[] = [];
  filtered: Task[] = [];
  activeFilter: TaskFilter = 'ALL';

  stats = {
    total: 0,
    done: 0,
    inProgress: 0,
    dueSoon: 0
  };

  constructor(
    private taskSvc: TaskService,
    private auth: AuthService
  ) {
    this.developerId = this.auth.getUserId() ?? 2;
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  trackById(_: number, task: Task): number {
    return task.id;
  }

  private loadTasks(): void {
    this.loading = true;
    this.taskSvc.getByDeveloper(this.developerId).subscribe({
      next: (tasks) => {
        if (!tasks.length) {
          this.taskSvc.getAll().subscribe({
            next: (allTasks) => this.setTasks(allTasks),
            error: () => this.loading = false
          });
        } else {
          this.setTasks(tasks);
        }
      },
      error: (err) => {
        console.error('Erreur chargement taches', err);
        this.loading = false;
      }
    });
  }

  private setTasks(tasks: Task[]): void {
    this.tasks = tasks;
    this.refreshStats();
    this.applyFilter(this.activeFilter);
    this.loading = false;
  }

  applyFilter(filter: TaskFilter): void {
    this.activeFilter = filter;
    this.filtered = this.tasks.filter(t => filter === 'ALL' ? true : t.statut === filter);
  }

  updateStatus(task: Task, status: Task['statut']): void {
    this.taskSvc.updateStatus(task.id, status).subscribe({
      next: (updated) => {
        const target = this.tasks.find(t => t.id === updated.id);
        if (target) {
          target.statut = updated.statut;
          target.avancement = updated.avancement ?? target.avancement;
        }
        this.applyFilter(this.activeFilter);
        this.refreshStats();
      },
      error: (err) => console.error('Erreur mise a jour statut', err)
    });
  }

  private refreshStats(): void {
    const done = this.tasks.filter(t => t.statut === 'TERMINEE').length;
    const inProgress = this.tasks.filter(t => t.statut === 'EN_COURS').length;
    const dueSoon = this.tasks.filter(t => {
      if (!t.dateLimite) return false;
      const diff = new Date(t.dateLimite).getTime() - Date.now();
      return diff <= 3 * 24 * 60 * 60 * 1000 && t.statut !== 'TERMINEE';
    }).length;

    this.stats = {
      total: this.tasks.length,
      done,
      inProgress,
      dueSoon
    };
  }

  progressValue(task: Task): number {
    if (task.avancement !== undefined) return task.avancement;
    if (task.statut === 'TERMINEE') return 100;
    if (task.statut === 'EN_COURS') return 60;
    return 10;
  }

  dueLabel(task: Task): string {
    if (!task.dateLimite) return 'Sans date';
    const diffDays = Math.ceil((new Date(task.dateLimite).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return `${Math.abs(diffDays)} j de retard`;
    if (diffDays === 0) return 'Aujourd hui';
    return `${diffDays} j restants`;
  }
}
