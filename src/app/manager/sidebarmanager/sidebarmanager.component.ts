import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebarmanager',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebarmanager.component.html',
  styleUrls: ['./sidebarmanager.component.css']
})
export class SidebarmanagerComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
