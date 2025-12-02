

export type MeetingStatus = 'A_VENIR' | 'EN_COURS' | 'TERMINE';

export interface Meeting {
  id: number;
  sujet: string;
  description?: string;
  dateHeure: string;           
  projetId: number;
  managerId: number;
  participantIds?: number[];
  rappel: boolean;
  statut?: MeetingStatus;
}

export interface MeetingDto {
  sujet: string;
  description?: string;
  dateHeure: string;
  projetId: number;
  managerId: number;
  participantIds?: number[];
  rappel: boolean;
  statut?: MeetingStatus;
}
