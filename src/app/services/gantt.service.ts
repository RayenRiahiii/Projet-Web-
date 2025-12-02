import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { GanttTaskDto } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class GanttService {
  private readonly tasksByProject = new Map<number, GanttTaskDto[]>();

  constructor() {
    
    this.ensureTasksForProject(1);
  }

  
  getAllTasks(): Observable<GanttTaskDto[]> {
    return of(this.flattenTasks()).pipe(delay(150));
  }

  
  getTasksByProject(projectId: number): Observable<GanttTaskDto[]> {
    const tasks = this.ensureTasksForProject(projectId);
    return of(tasks).pipe(delay(150));
  }

  
  updateTask(taskId: number, task: GanttTaskDto): Observable<GanttTaskDto> {
    for (const [projectId, tasks] of this.tasksByProject.entries()) {
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks[index] = { ...task };
        this.tasksByProject.set(projectId, tasks);
        return of(tasks[index]).pipe(delay(150));
      }
    }

    
    const fallbackProjectId = 1;
    const list = this.ensureTasksForProject(fallbackProjectId);
    const newTask = { ...task, id: task.id ?? list.length + 1 };
    list.push(newTask);
    this.tasksByProject.set(fallbackProjectId, list);
    return of(newTask).pipe(delay(150));
  }

  

  private ensureTasksForProject(projectId: number): GanttTaskDto[] {
    if (!this.tasksByProject.has(projectId)) {
      this.tasksByProject.set(projectId, this.generateMockTasks(projectId));
    }
    return this.tasksByProject.get(projectId)!;
  }

  private flattenTasks(): GanttTaskDto[] {
    return Array.from(this.tasksByProject.values()).flat();
  }

  private generateMockTasks(projectId: number): GanttTaskDto[] {
    const today = new Date();
    const startDateBase = new Date(today);
    startDateBase.setDate(today.getDate() - 7);

    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    const mockTaskSets: GanttTaskDto[][] = [
      [
        {
          id: 1,
          nom: 'Analyse des besoins',
          dateDebutPrevue: formatDate(startDateBase),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 5 * 24 * 60 * 60 * 1000)),
          avancement: 100
        },
        {
          id: 2,
          nom: 'Conception architecture',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 6 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 15 * 24 * 60 * 60 * 1000)),
          avancement: 70
        },
        {
          id: 3,
          nom: 'Developpement Frontend',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 16 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 30 * 24 * 60 * 60 * 1000)),
          avancement: 30
        },
        {
          id: 4,
          nom: 'Developpement Backend',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 16 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 35 * 24 * 60 * 60 * 1000)),
          avancement: 20
        }
      ],
      [
        {
          id: 1,
          nom: 'Etude de marche',
          dateDebutPrevue: formatDate(startDateBase),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 10 * 24 * 60 * 60 * 1000)),
          avancement: 80
        },
        {
          id: 2,
          nom: 'Creation contenu marketing',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 11 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 25 * 24 * 60 * 60 * 1000)),
          avancement: 40
        },
        {
          id: 3,
          nom: 'Campagne reseaux sociaux',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 20 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 40 * 24 * 60 * 60 * 1000)),
          avancement: 10
        }
      ],
      [
        {
          id: 1,
          nom: 'Plans et conception',
          dateDebutPrevue: formatDate(startDateBase),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 15 * 24 * 60 * 60 * 1000)),
          avancement: 100
        },
        {
          id: 2,
          nom: 'Fondations',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 16 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 30 * 24 * 60 * 60 * 1000)),
          avancement: 60
        },
        {
          id: 3,
          nom: 'Structure',
          dateDebutPrevue: formatDate(new Date(startDateBase.getTime() + 31 * 24 * 60 * 60 * 1000)),
          dateFinPrevue: formatDate(new Date(startDateBase.getTime() + 50 * 24 * 60 * 60 * 1000)),
          avancement: 0
        }
      ]
    ];

    const mockTasks = mockTaskSets[projectId % mockTaskSets.length];
    return mockTasks.map(task => ({ ...task }));
  }
}
