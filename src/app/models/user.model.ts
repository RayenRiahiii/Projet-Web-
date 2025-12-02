

export enum UserRole {
    DEVELOPPEUR = 'DEVELOPPEUR',
    MANAGER     = 'MANAGER',
    ADMIN       = 'ADMIN',
  }
  
  export interface User {
    id:            number;
    nom:           string;
    email:         string;
    role:          UserRole;
    motDePasse?:   string;     
    pointsTotal?:  number;     
    photo?:        string;
    competences?:  string;
    experiences?:  number;
    disponibilite?: boolean;
  }
  
  
  
  export interface UserCreate {
    nom:           string;
    email:         string;
    motDePasse:    string;
    role:          UserRole;
    competences?:  string;
    experiences?:  number;
    disponibilite?: boolean;
    photo?:        string;
  }
  