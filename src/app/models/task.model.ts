


export interface Task {
  id: number;
  nom: string;
  description?: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
  dateLimite?: string;         
  dateDebutPrevue?: string;    
  dateFinPrevue?: string;      
  dateDebutReelle?: string;    
  dateFinReelle?: string;      
  avancement?: number;         
  estimatedDays?: number;      
  spentDays?: number;          

  
  projet?: {
    id: number;
    nom?: string;
  };

  
  responsable?: {
    id: number;
    nom: string;
  };

  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  quality?: 'LOW' | 'MEDIUM' | 'HIGH';
}


export interface TaskDto {
  nom: string;
  description?: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
  dateLimite?: string;         
  projetId: number;
  responsableId?: number;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  dateDebutPrevue?: string;    
  dateFinPrevue?: string;      
  dateDebutReelle?: string;    
  dateFinReelle?: string;      
  estimatedDays?: number;
  spentDays?: number;
}


export interface GanttTaskDto {
  id: number;
  nom: string;
  dateDebutPrevue: string;    
  dateFinPrevue: string;      
  avancement: number;         
}
