


export enum NotificationType {
    UTILISATEUR = 'UTILISATEUR',
    PROJET      = 'PROJET',
    TACHE       = 'TACHE',
    MEETING     = 'MEETING',
    TECHNIQUE   = 'TECHNIQUE',
    SUPPORT     = 'SUPPORT',
    MESSAGE     = 'MESSAGE',
    REPORT      = 'REPORT'
  }
  
  export interface Notification {
    id:          number;
    title:       string;
    message:     string;
    type:        NotificationType;
    isRead:      boolean;
    createdAt:   string;          
  }
  