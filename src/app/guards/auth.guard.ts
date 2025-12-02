import { Injectable } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService,
              private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    
    const expectedRoles: string[] | undefined = route.data['expectedRoles'];
    if (expectedRoles && !expectedRoles.includes(this.auth.getRole() || '')) {
      
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
