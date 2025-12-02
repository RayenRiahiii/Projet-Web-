
import { Component, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

import { SidebaradminComponent } from './admin/sidebaradmin/sidebaradmin.component';
import { SidebardeveloppeurComponent } from './developpeur/sidebardeveloppeur/sidebardeveloppeur.component';
import { SidebarmanagerComponent } from './manager/sidebarmanager/sidebarmanager.component';
import { NavbarComponent } from './admin/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    NavbarComponent,
    SidebaradminComponent,
    SidebardeveloppeurComponent,
    SidebarmanagerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  
  readonly title = 'Collabflow';

  
  showAdminSidebar = false;
  showDevSidebar   = false;
  showManSidebar   = false;  

  private router = inject(Router);
  private sub: Subscription;

  constructor() {
    
    this.sub = this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(evt => {
        const url = (evt as NavigationEnd).urlAfterRedirects;
        this.showAdminSidebar = url.startsWith('/admin');
        this.showDevSidebar   = url.startsWith('/developpeur');
        this.showManSidebar   = url.startsWith('/manager');
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
