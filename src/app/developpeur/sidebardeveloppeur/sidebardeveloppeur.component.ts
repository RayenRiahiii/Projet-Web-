import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebardeveloppeur',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebardeveloppeur.component.html',
  styleUrls: ['./sidebardeveloppeur.component.css']
})
export class SidebardeveloppeurComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
