

import { User } from './user.model';

export type ProjectStatut = 'EN_COURS' | 'TERMINE' | 'EN_ATTENTE';
export type ProjectType   = 'SIMPLE' | 'INTERMEDIAIRE' | 'COMPLEXE';

//declaration interface project
export interface Project {
  id: number;
  nom: string;
  description?: string;
  dateDebut?: string;         
  dateFinPrevue?: string;     
  dateFinEffective?: string;  
  statut: ProjectStatut;
  type: ProjectType;
  manager?: {                   
    id: number;
    nom: string;
  };
  backlog?: string[];
  retard?: boolean;
  nbJoursRetard?: number;
  assignedDevelopers?: Array<{
    id: number;
    nom: string;
  }>;
  
  nbTaches?: number;
  nbTachesCompletes?: number;
  pourcentageAvancement?: number;
}

//declaration interface project
export interface ProjectDto {
  nom: string;
  description: string;
  dateDebut?: string;
  dateFinPrevue: string;
  dateFinEffective?: string;
  statut: ProjectStatut;
  type: ProjectType;
  managerId: number;
  backlog?: string[];
}
