import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebaradmin',
  standalone: true,
  imports: [ RouterLink, RouterLinkActive],
  templateUrl: './sidebaradmin.component.html',
  styleUrls: ['./sidebaradmin.component.css']
})
export class SidebaradminComponent {
  constructor(private auth: AuthService, private router: Router) {}

  
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
