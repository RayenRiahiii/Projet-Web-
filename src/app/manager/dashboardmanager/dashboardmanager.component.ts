import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { MeetingService } from '../../services/meeting.service';
import { ReportService } from '../../services/report.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { Meeting } from '../../models/meeting.model';
import { Report } from '../../models/report.models';

@Component({
  selector: 'app-dashboardmanager',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboardmanager.component.html',
  styleUrls: ['./dashboardmanager.component.css']
})
export class DashboardmanagerComponent implements OnInit {
  loading = true;
  managerId!: number;

  projects: Project[] = [];
  tasks: Task[] = [];
  meetings: Meeting[] = [];
  reports: Report[] = [];

  stats = {
    projects: 0,
    tasks: 0,
    tasksDone: 0,
    riskProjects: 0,
    meetingsToday: 0
  };

  criticalTasks: Task[] = [];
  upcomingMeetings: Meeting[] = [];

  constructor(
    private auth: AuthService,
    private projectSvc: ProjectService,
    private taskSvc: TaskService,
    private meetingSvc: MeetingService,
    private reportSvc: ReportService
  ) {
    this.managerId = this.auth.getUserId() ?? 1;
  }

  ngOnInit(): void {
    this.loadData();
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      projects: this.projectSvc.getByManager(this.managerId),
      tasks: this.taskSvc.getAll(),
      meetings: this.meetingSvc.getByManager(this.managerId),
      reports: this.reportSvc.getSentReports(this.managerId)
    }).subscribe({
      next: ({ projects, tasks, meetings, reports }) => {
        this.projects = projects;
        this.tasks = tasks.filter(t => projects.some(p => p.id === t.projet?.id));
        this.meetings = meetings;
        this.reports = reports;

        this.computeStats();
        this.prepareHighlights();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement dashboard manager', err);
        this.loading = false;
      }
    });
  }

  private computeStats(): void {
    const tasksDone = this.tasks.filter(t => t.statut === 'TERMINEE').length;
    const riskProjects = this.projects.filter(p => p.retard || (p.nbJoursRetard ?? 0) > 0).length;
    const meetingsToday = this.meetings.filter(m => {
      const d = new Date(m.dateHeure);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;

    this.stats = {
      projects: this.projects.length,
      tasks: this.tasks.length,
      tasksDone,
      riskProjects,
      meetingsToday
    };
  }

  private prepareHighlights(): void {
    this.criticalTasks = this.tasks
      .filter(t => t.priorite === 'HAUTE' || t.statut !== 'TERMINEE')
      .sort((a, b) => (a.dateLimite ? new Date(a.dateLimite).getTime() : Number.MAX_SAFE_INTEGER) -
        (b.dateLimite ? new Date(b.dateLimite).getTime() : Number.MAX_SAFE_INTEGER))
      .slice(0, 5);

    this.upcomingMeetings = [...this.meetings]
      .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
      .slice(0, 4);
  }

  completion(task: Task): number {
    return task.avancement ?? (task.statut === 'TERMINEE' ? 100 : task.statut === 'EN_COURS' ? 60 : 10);
  }
}
