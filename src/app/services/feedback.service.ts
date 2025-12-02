import { Injectable } from '@angular/core';
import { Observable, of, Subject, delay } from 'rxjs';

import { DeveloperFeedback, FeedbackForm } from '../models/feedback.models';
import { Project } from '../models/project.model';
import { User, UserRole } from '../models/user.model';
import { AuthService, CurrentUser } from './auth.service';


const MOCK_USERS: User[] = [
  { id: 1, nom: 'Alice', email: 'alice@example.com', role: UserRole.MANAGER },
  { id: 2, nom: 'Bob', email: 'bob@example.com', role: UserRole.DEVELOPPEUR }
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 101,
    nom: 'Projet démo',
    description: 'Projet de démonstration',
    statut: 'EN_COURS',
    type: 'INTERMEDIAIRE',
    manager: { id: 1, nom: 'Alice' }
  }
];

const MOCK_FEEDBACKS: DeveloperFeedback[] = [
  {
    id: 1001,
    project: MOCK_PROJECTS[0],
    developer: MOCK_USERS[1],
    qualiteCode: 4,
    respectDelais: 5,
    travailEquipe: 4,
    autonomie: 5,
    score10: 4.5,
    commentaire: 'Très bon travail',
    createdAt: new Date().toISOString(),
    updatedAt: null
  }
];

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly _projectStream$ = new Subject<DeveloperFeedback>();
  private readonly _personalStream$ = new Subject<DeveloperFeedback>();

  readonly projectStream$ = this._projectStream$.asObservable();
  readonly personalStream$ = this._personalStream$.asObservable();

  constructor(
    private auth: AuthService,
    
  ) {}

  
  initWebSocket(projectIdsOfInterest: number[]): void {
    
  }

  closeWebSocket(): void {
    
  }

  
  giveFeedback(projectId: number, developerId: number, form: FeedbackForm): Observable<DeveloperFeedback> {
    const project = MOCK_PROJECTS.find(p => p.id === projectId) ?? MOCK_PROJECTS[0];
    const developer = MOCK_USERS.find(u => u.id === developerId) ?? MOCK_USERS[1];
    const feedback: DeveloperFeedback = {
      id: Math.floor(Math.random() * 10000),
      project,
      developer,
      qualiteCode: form.qualiteCode,
      respectDelais: form.respectDelais,
      travailEquipe: form.travailEquipe,
      autonomie: form.autonomie,
      score10: (form.qualiteCode + form.respectDelais + form.travailEquipe + form.autonomie) / 4 * 2,
      commentaire: form.commentaire ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    return of(feedback).pipe(delay(300));
  }

  modifyFeedback(projectId: number, developerId: number, form: FeedbackForm): Observable<DeveloperFeedback> {
    return this.giveFeedback(projectId, developerId, form);
  }

  getFeedbacksByDeveloper(devId: number): Observable<DeveloperFeedback[]> {
    const feedbacks = MOCK_FEEDBACKS.filter(fb => fb.developer.id === devId);
    return of(feedbacks).pipe(delay(200));
  }

  getFeedbacksByProject(projectId: number): Observable<DeveloperFeedback[]> {
    const feedbacks = MOCK_FEEDBACKS.filter(fb => fb.project.id === projectId);
    return of(feedbacks).pipe(delay(200));
  }

  getTotalPoints(devId: number): Observable<number> {
    const feedbacks = MOCK_FEEDBACKS.filter(fb => fb.developer.id === devId);
    const totalPoints = feedbacks.reduce((sum, fb) => sum + fb.score10, 0);
    return of(totalPoints).pipe(delay(200));
  }

  getFeedbackForProjectAndDeveloper(projectId: number, devId: number): Observable<DeveloperFeedback> {
    
    const feedback = MOCK_FEEDBACKS.find(fb => fb.project.id === projectId && fb.developer.id === devId);
    
    const defaultFeedback: DeveloperFeedback = {
      id: 0,
      project: { id: projectId, nom: '', statut: 'EN_ATTENTE', type: 'SIMPLE', manager: { id: 0, nom: '' } },
      developer: { id: devId, nom: '', email: '', role: UserRole.DEVELOPPEUR },
      qualiteCode: 0,
      respectDelais: 0,
      travailEquipe: 0,
      autonomie: 0,
      score10: 0,
      commentaire: null,
      createdAt: '',
      updatedAt: null
    };
    return of(feedback ?? defaultFeedback).pipe(delay(200));
  }
  

  getProjectsWithFeedback(devId: number): Observable<Project[]> {
    const projects = MOCK_FEEDBACKS
      .filter(fb => fb.developer.id === devId)
      .map(fb => fb.project);
    return of(projects).pipe(delay(200));
  }

  getProjectsWithoutFeedback(devId: number): Observable<Project[]> {
    const projects = MOCK_PROJECTS.filter(p =>
      !MOCK_FEEDBACKS.some(fb => fb.project.id === p.id && fb.developer.id === devId)
    );
    return of(projects).pipe(delay(200));
  }

  getFeedbacksWithProjects(devId: number): Observable<Record<string, DeveloperFeedback>> {
    const map: Record<string, DeveloperFeedback> = {};
    MOCK_FEEDBACKS.filter(fb => fb.developer.id === devId)
      .forEach(fb => {
        map[fb.project.id.toString()] = fb;
      });
    return of(map).pipe(delay(200));
  }

  hasBeenNoted(projectId: number, devId: number): Observable<boolean> {
    const noted = MOCK_FEEDBACKS.some(fb => fb.project.id === projectId && fb.developer.id === devId);
    return of(noted).pipe(delay(200));
  }

  getRewardsHistory(devId: number): Observable<string[]> {
    
    return of(['Récompense Annuelle', 'Meilleur Collaborateur']).pipe(delay(200));
  }
}
