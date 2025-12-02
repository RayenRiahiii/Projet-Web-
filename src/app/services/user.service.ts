import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap, delay } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User, UserRole, UserCreate } from '../models/user.model';


export let MOCK_USERS: User[] = [
  {
    id: 1,
    nom: "Alice Manager",
    email: "alice.manager@example.com",
    role: UserRole.MANAGER,
    motDePasse: "alice123",
    pointsTotal: 120,
    disponibilite: true,
    competences: "Leadership, Communication",
    experiences: 5,
    photo: ""
  },
  {
    id: 2,
    nom: "Bob Dev",
    email: "bob.developpeur@example.com",
    role: UserRole.DEVELOPPEUR,
    motDePasse: "bobpass",
    pointsTotal: 80,
    disponibilite: false,
    competences: "Angular, Node.js",
    experiences: 2,
    photo: ""
  },
  {
    id: 3,
    nom: "Clara Admin",
    email: "clara.admin@example.com",
    role: UserRole.ADMIN,
    motDePasse: "claraadmin",
    photo: ""
  }
];



interface JwtPayload {
  id: number;
  role: UserRole | string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private _me$?: Observable<User>;

  constructor() {}

  
  getAll(): Observable<User[]> {
    return of(MOCK_USERS).pipe(delay(200));
  }

  
  getById(id: number): Observable<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    return of(user!).pipe(delay(200));
  }

  
  me(): Observable<User> {
    if (this._me$) { return this._me$; }
    const token = localStorage.getItem('token');
    if (!token) { throw new Error('Aucun JWT stocké'); }
    const { id } = jwtDecode<JwtPayload>(token);
    this._me$ = this.getById(id).pipe(shareReplay(1));
    return this._me$;
  }

  
  photoUrl(fileName?: string | null): string {
    return fileName ? `/uploads/${fileName}` : 'assets/profile.png';
  }

  
  create(u: UserCreate): Observable<User> {
    const newUser: User = {
      id: MOCK_USERS.length + 1,
      nom: u.nom,
      email: u.email,
      role: u.role,
      motDePasse: u.motDePasse,
      competences: u.competences,
      experiences: u.experiences,
      disponibilite: u.disponibilite,
      photo: u.photo
    };
    MOCK_USERS.push(newUser);
    return of(newUser).pipe(delay(200));
  }

  
  update(id: number, u: Partial<User>): Observable<User> {
    const user = MOCK_USERS.find(user => user.id === id);
    if (user) {
      Object.assign(user, this.cleanPayload(u));
      this.invalidateCache(id);
    }
    return of(user!).pipe(delay(200));
  }

  
  delete(id: number): Observable<any> {
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
    this.invalidateCache(id);
    return of(void 0).pipe(delay(200));
  }

  
  uploadPhoto(id: number, file: File): Observable<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) {
      user.photo = file.name;
      this.invalidateCache(id);
    }
    return of(user!).pipe(delay(200));
  }

  
  deletePhoto(id: number): Observable<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) {
      user.photo = undefined;
      this.invalidateCache(id);
    }
    return of(user!).pipe(delay(200));
  }

  
  private cleanPayload<T extends Record<string, any>>(obj: T): T {
    const clone: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined || v === null) { return; }
      if (typeof v === 'string' && v.trim() === '') { return; }
      clone[k] = v;
    });
    return clone as T;
  }

  private invalidateCache(id: number): void {
    if (this._me$) { this._me$ = undefined; }
  }
}
