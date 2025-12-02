import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay, map, tap,throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import {MOCK_USERS} from './user.service';

export interface AuthResponse { token: string; }
export interface JwtPayload {
  sub: string;
  id: number;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPPEUR';
  exp: number;
  iat: number;
}
export interface CurrentUser { id: number; email: string; role: JwtPayload['role']; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private authStatus$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor() {}

  
  
  
  login(email: string, password: string): Observable<boolean> {
    
    const user = MOCK_USERS.find(u => 
      u.email === email && u.motDePasse === password
    );
    
    
    if (!user) {
      return throwError(() => new Error('Identifiants incorrects'));
    }
    
    
    const fakeToken = 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      btoa(JSON.stringify({
        sub: user.email,
        id: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })) +
      '.MOCKSIGNATURE';
    
    return of({ token: fakeToken }).pipe(
      delay(300),
      tap(res => this.setToken(res.token)),
      map(() => true)
    );
  }
  
  register(body: any): Observable<void> {
    
    const fakeToken = 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJhbmd1bGFyQGV4YW1wbGUuY29tIiwiaWQiOjEsInJvbGUiOiJBRE1JTiIsImV4cCI6Mzg5MjUzODQwMCwiaWF0IjoxNjYzMjAwMDB9.' +
      'MOCKSIGNATURE';
    return of({ token: fakeToken }).pipe(
      delay(300),
      tap(res => this.setToken(res.token)),
      map(() => void 0)
    );
  }
  
  
  
  private setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.authStatus$.next(true);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
      this.authStatus$.next(false);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    this.setToken(null);
  }

  
  
  
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) { return false; }
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      return Date.now() / 1000 < exp;
    } catch {
      return false;
    }
  }

  getRole(): JwtPayload['role'] | null {
    const token = this.getToken();
    if (!token) { return null; }
    try {
      return jwtDecode<JwtPayload>(token).role;
    } catch {
      return null;
    }
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) { return null; }
    try {
      return jwtDecode<JwtPayload>(token).id;
    } catch {
      return null;
    }
  }

  
  getCurrentUser(): CurrentUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const { sub, id, role } = jwtDecode<JwtPayload>(token);
      return { id, email: sub, role };
    } catch {
      return null;
    }
  }

  
  authChanges(): Observable<boolean> {
    return this.authStatus$.asObservable();
  }

  
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
