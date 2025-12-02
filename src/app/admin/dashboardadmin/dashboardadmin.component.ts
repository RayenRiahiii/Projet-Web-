import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-dashboardadmin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboardadmin.component.html',
  styleUrls: ['./dashboardadmin.component.css']
})
export class DashboardadminComponent implements OnInit {
  loading = true;

  stats = {
    totalUsers: 0,
    managers: 0,
    developers: 0,
    admins: 0,
    projects: 0,
    projectsActive: 0,
    tasksTodo: 0,
    tasksDone: 0,
    completion: 0
  };

  projects: Project[] = [];
  tasks: Task[] = [];
  team: User[] = [];

  highlightedProjects: Project[] = [];//les plus actives
  upcomingTasks: Task[] = [];

  constructor(
    private projectSvc: ProjectService,
    private taskSvc: TaskService,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  trackById(_: number, item: {id: number}): number {
    return item.id;
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      projects: this.projectSvc.getAll(),
      tasks: this.taskSvc.getAll(),
      users: this.userSvc.getAll()
    }).subscribe({
      next: ({ projects, tasks, users }) => {
        this.projects = projects;
        this.tasks = tasks;
        this.team = users;

        this.computeStats(projects, tasks, users);
        this.prepareWidgets(projects, tasks, users);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement du tableau de bord admin', err);
        this.loading = false;
      }
    });
  }
//computeStats pour calculer les statistiques
  private computeStats(projects: Project[], tasks: Task[], users: User[]): void {
    const managers = users.filter(u => u.role === UserRole.MANAGER).length;
    const developers = users.filter(u => u.role === UserRole.DEVELOPPEUR).length;
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const tasksDone = tasks.filter(t => t.statut === 'TERMINEE').length;
    const tasksTodo = tasks.length - tasksDone;
    const completion = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0;

    this.stats = {
      totalUsers: users.length,
      managers,
      developers,
      admins,
      projects: projects.length,
      projectsActive: projects.filter(p => p.statut === 'EN_COURS').length,
      tasksTodo,
      tasksDone,
      completion
    };
  }
//preparer les widgets des statistique
  private prepareWidgets(projects: Project[], tasks: Task[], users: User[]): void {
    this.highlightedProjects = [...projects]
      .sort((a, b) => (b.pourcentageAvancement ?? 0) - (a.pourcentageAvancement ?? 0))
      .slice(0, 4);

    this.upcomingTasks = tasks
      .filter(t => !!t.dateLimite)
      .sort((a, b) => new Date(a.dateLimite ?? '').getTime() - new Date(b.dateLimite ?? '').getTime())
      .slice(0, 4);

    
    this.team = users.slice(0, 6);
  }
//URL du photo AVATAR de chaque user listé 
  photoUrl(photo?: string | null): string {
    return this.userSvc.photoUrl(photo);
  }
}
