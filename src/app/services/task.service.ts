import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Task, TaskDto } from '../models/task.model';


let MOCK_TASKS: Task[] = [
  {
    id: 1,
    nom: "Database Schema",
    statut: "TERMINEE",
    description: "Design the database structure.",
    dateLimite: "2025-03-01",
    projet: { id: 101, nom: "Internal CRM" },
    responsable: { id: 2, nom: "Bob Dev" },
    avancement: 100,
    priorite: "HAUTE",
    quality: "HIGH"
  },
  {
    id: 2,
    nom: "REST API",
    statut: "EN_COURS",
    projet: { id: 101, nom: "Internal CRM" },
    responsable: { id: 2, nom: "Bob Dev" },
    avancement: 60,
    priorite: "MOYENNE",
    estimatedDays: 15,
    spentDays: 9
  },
  {
    id: 3,
    nom: "Client Feedback",
    statut: "A_FAIRE",
    projet: { id: 102, nom: "Mobile App Launch" },
    priorite: "BASSE"
  }
];


@Injectable({
  providedIn: 'root'
})
export class TaskService {
  
  getAll(): Observable<Task[]> {
    return of(MOCK_TASKS).pipe(delay(200));
  }

  
  getById(id: number): Observable<Task> {
    const task = MOCK_TASKS.find(t => t.id === id);
    return of(task!).pipe(delay(200));
  }

  
  create(taskDto: TaskDto): Observable<Task> {
    const newTask: Task = {
      id: MOCK_TASKS.length + 1,
      ...taskDto,
      statut: taskDto.statut,
      projet: { id: taskDto.projetId, nom: "Projet " + taskDto.projetId },
      responsable: taskDto.responsableId
        ? { id: taskDto.responsableId, nom: "User " + taskDto.responsableId }
        : undefined,
      
      priorite: taskDto.priorite,
      estimatedDays: taskDto.estimatedDays,
      spentDays: taskDto.spentDays
    };
    MOCK_TASKS.push(newTask);
    return of(newTask).pipe(delay(200));
  }

  
  update(id: number, taskDto: TaskDto): Observable<Task> {
    let task = MOCK_TASKS.find(t => t.id === id);
    if (task) {
      Object.assign(task, taskDto, {
        projet: { id: taskDto.projetId, nom: "Projet " + taskDto.projetId },
        responsable: taskDto.responsableId
          ? { id: taskDto.responsableId, nom: "User " + taskDto.responsableId }
          : undefined
      });
    }
    return of(task!).pipe(delay(200));
  }

  
  delete(id: number): Observable<void> {
    MOCK_TASKS = MOCK_TASKS.filter(t => t.id !== id);
    return of(void 0).pipe(delay(200));
  }

  
  updateStatus(id: number, status: string): Observable<Task> {
    let task = MOCK_TASKS.find(t => t.id === id);
    if (task) {
      task.statut = status as 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
    }
    return of(task!).pipe(delay(200));
  }

  
  assign(taskId: number, userId: number): Observable<Task> {
    let task = MOCK_TASKS.find(t => t.id === taskId);
    if (task) {
      task.responsable = { id: userId, nom: "User " + userId };
    }
    return of(task!).pipe(delay(200));
  }

  
  getByDeveloper(developerId: number): Observable<Task[]> {
    return of(MOCK_TASKS.filter(t => t.responsable?.id === developerId)).pipe(delay(200));
  }

  
  searchByName(nom: string): Observable<Task[]> {
    return of(MOCK_TASKS.filter(t => t.nom.toLowerCase().includes(nom.toLowerCase()))).pipe(delay(200));
  }

  
  getByProject(projectId: number): Observable<Task[]> {
    return of(MOCK_TASKS.filter(t => t.projet?.id === projectId)).pipe(delay(200));
  }

  
  updateQuality(id: number, quality: string): Observable<Task> {
    let task = MOCK_TASKS.find(t => t.id === id);
    if (task) {
      task.quality = quality as "LOW" | "MEDIUM" | "HIGH";
    }
    return of(task!).pipe(delay(200));
  }

  
  getByProjectAndStatus(projectId: number, status: string): Observable<Task[]> {
    return of(MOCK_TASKS.filter(
      t => t.projet?.id === projectId && t.statut === status
    )).pipe(delay(200));
  }

  
  getByStatus(status: string): Observable<Task[]> {
    return of(MOCK_TASKS.filter(t => t.statut === status)).pipe(delay(200));
  }

  
  updateDates(id: number, dates: Partial<TaskDto>): Observable<Task> {
    let task = MOCK_TASKS.find(t => t.id === id);
    if (task) {
      Object.assign(task, dates);
    }
    return of(task!).pipe(delay(200));
  }
}
