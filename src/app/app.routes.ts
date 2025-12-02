import { Routes } from '@angular/router';


import { LoginComponent } from './admin/login/login.component';

import { AuthGuard } from './guards/auth.guard';


import { DashboardadminComponent }       from './admin/dashboardadmin/dashboardadmin.component';
import { GestionUtilisateursComponent }  from './admin/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionProjetsComponent }       from './admin/gestion-projets/gestion-projets.component';
import { RapportadminComponent }         from './admin/rapportadmin/rapportadmin.component';


import { DashboardmanagerComponent }     from './manager/dashboardmanager/dashboardmanager.component';
import { ProjetsComponent }              from './manager/projets/projets.component';
import { RisqueprojetComponent }         from './manager/risqueprojet/risqueprojet.component';
import { MeetingsComponent }             from './manager/plannification/meetings/meetings.component';
import { PlanningComponent }             from './manager/plannification/planning/planning.component';
import { EquipeComponent }               from './manager/equipe/equipe.component';
import { RapportmanagerComponent }       from './manager/rapportmanager/rapportmanager.component';
import { FeedbackManagerComponent }      from './manager/feedbackmanager/feedbackmanager.component';


import { TachesdeveloppeurComponent }    from './developpeur/tachesdeveloppeur/tachesdeveloppeur.component';
import { CalendrierdeveloppeurComponent }from './developpeur/calendrierdeveloppeur/calendrierdeveloppeur.component';
import { FeedbackdeveloppeurComponent }  from './developpeur/feedbackdeveloppeur/feedbackdeveloppeur.component';

export const routes: Routes = [
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  
  { path: 'login', component: LoginComponent },

  
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { expectedRoles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',            component: DashboardadminComponent },
      { path: 'gestion-utilisateurs', component: GestionUtilisateursComponent },
      { path: 'gestion-projets',      component: GestionProjetsComponent },
      { path: 'rapports',             component: RapportadminComponent }
    ]
  },

  
  {
    path: 'manager',
    canActivate: [AuthGuard],
    data: { expectedRoles: ['MANAGER'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',        component: DashboardmanagerComponent },
      { path: 'projets',          component: ProjetsComponent },
      { path: 'risques',          component: RisqueprojetComponent },
      { path: 'meetings',         component: MeetingsComponent },
      { path: 'planning',         component: PlanningComponent },
      { path: 'equipe',           component: EquipeComponent },
      { path: 'rapport',          component: RapportmanagerComponent },
      { path: 'feedback',         component: FeedbackManagerComponent }
      
    ]
  },

  
  {
    path: 'developpeur',
    canActivate: [AuthGuard],
    data: { expectedRoles: ['DEVELOPPEUR'] },
    children: [
      { path: '', redirectTo: 'taches', pathMatch: 'full' },
      { path: 'taches',      component: TachesdeveloppeurComponent },
      { path: 'calendrier',  component: CalendrierdeveloppeurComponent },
      { path: 'feedback',    component: FeedbackdeveloppeurComponent }
      
    ]
  },

  
  { path: '**', redirectTo: 'login' }
];
