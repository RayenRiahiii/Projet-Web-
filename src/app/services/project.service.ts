import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Project, ProjectDto, ProjectStatut } from '../models/project.model';


let MOCK_PROJECTS: Project[] = [
  {
    id: 101,
    nom: "Internal CRM",
    description: "Development of the internal CRM tool.",
    dateDebut: "2025-02-15",
    dateFinPrevue: "2026-01-15",
    statut: "EN_COURS",
    type: "INTERMEDIAIRE",
    manager: { id: 1, nom: "Alice Manager" },
    backlog: ["Setup DB", "REST API", "Frontend"],
    assignedDevelopers: [{ id: 2, nom: "Bob Dev" }],
    nbTaches: 12,
    nbTachesCompletes: 6,
    pourcentageAvancement: 50
  },
  {
    id: 102,
    nom: "Mobile App Launch",
    description: "New mobile application for clients.",
    dateDebut: "2025-01-01",
    dateFinPrevue: "2025-10-01",
    statut: "EN_ATTENTE",
    type: "SIMPLE",
    manager: { id: 1, nom: "Alice Manager" },
    backlog: [],
    assignedDevelopers: [],
    nbTaches: 5,
    nbTachesCompletes: 0,
    pourcentageAvancement: 0
  }
];


@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  

  
  create(dto: ProjectDto): Observable<Project> {
    const newProject: Project = {
      id: MOCK_PROJECTS.length + 1,
      ...dto,
      manager: { id: dto.managerId, nom: "Manager " + dto.managerId },
      statut: dto.statut,
      type: dto.type,
      backlog: dto.backlog ?? []
    };
    MOCK_PROJECTS.push(newProject);
    return of(newProject).pipe(delay(200));
  }

  
  getAll(): Observable<Project[]> {
    return of(MOCK_PROJECTS).pipe(delay(200));
  }

  
  getById(id: number): Observable<Project> {
    const project = MOCK_PROJECTS.find(p => p.id === id);
    return of(project!).pipe(delay(200));
  }

  
  update(id: number, dto: ProjectDto): Observable<Project> {
    let project = MOCK_PROJECTS.find(p => p.id === id);
    if (project) {
      Object.assign(project, dto, { manager: { id: dto.managerId, nom: "Manager " + dto.managerId } });
    }
    return of(project!).pipe(delay(200));
  }

  
  delete(id: number): Observable<void> {
    MOCK_PROJECTS = MOCK_PROJECTS.filter(p => p.id !== id);
    return of(void 0).pipe(delay(200));
  }

  
  updateStatus(id: number, statut: ProjectStatut): Observable<Project> {
    let project = MOCK_PROJECTS.find(p => p.id === id);
    if (project) {
      project.statut = statut;
    }
    return of(project!).pipe(delay(200));
  }

  
  assignManager(projectId: number, managerId: number): Observable<Project> {
    let project = MOCK_PROJECTS.find(p => p.id === projectId);
    if (project) {
      project.manager = { id: managerId, nom: "Manager " + managerId };
    }
    return of(project!).pipe(delay(200));
  }

  
  getByManager(managerId: number): Observable<Project[]> {
    return of(MOCK_PROJECTS.filter(p => p.manager?.id === managerId)).pipe(delay(200));
  }

  
  getByStatus(statut: ProjectStatut): Observable<Project[]> {
    return of(MOCK_PROJECTS.filter(p => p.statut === statut)).pipe(delay(200));
  }

  
  searchByName(nom: string): Observable<Project[]> {
    return of(MOCK_PROJECTS.filter(p => p.nom.toLowerCase().includes(nom.toLowerCase()))).pipe(delay(200));
  }

  
  getDetails(id: number): Observable<Project> {
    return this.getById(id);
  }

  
  getAllDetails(): Observable<Project[]> {
    return this.getAll();
  }

  
  fillIndicatorsAndPredict(id: number): Observable<Project> {
    let project = MOCK_PROJECTS.find(p => p.id === id);
    if (project) {
      
      project.retard = (project.nbTaches ?? 0) - (project.nbTachesCompletes ?? 0) > 2;
      project.nbJoursRetard = project.retard ? 5 : 0;
      project.pourcentageAvancement = ((project.nbTachesCompletes ?? 0) / (project.nbTaches ?? 1)) * 100;
    }
    return of(project!).pipe(delay(200));
  }
}
