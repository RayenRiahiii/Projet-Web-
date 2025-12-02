import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Meeting, MeetingDto, MeetingStatus } from '../models/meeting.model';


const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    sujet: "Réunion projet",
    description: "Avancement du projet",
    dateHeure: new Date().toISOString(),
    projetId: 101,
    managerId: 1,
    participantIds: [1, 2],
    rappel: true,
    statut: 'A_VENIR'
  },
  {
    id: 2,
    sujet: "Planification Sprint",
    description: "Sprint planning pour équipe dev",
    dateHeure: new Date().toISOString(),
    projetId: 101,
    managerId: 1,
    participantIds: [2],
    rappel: false,
    statut: 'EN_COURS'
  }
];

@Injectable({
  providedIn: 'root',
})
export class MeetingService {
  private meetings = [...MOCK_MEETINGS];

  
  create(dto: MeetingDto): Observable<Meeting> {
    const newMeeting: Meeting = {
      id: this.meetings.length + 1,
      ...dto
    };
    this.meetings.push(newMeeting);
    return of(newMeeting).pipe(delay(200));
  }

  
  getAll(): Observable<Meeting[]> {
    return of(this.meetings).pipe(delay(200));
  }

  
  getById(id: number): Observable<Meeting> {
    const meeting = this.meetings.find(m => m.id === id);
    const defaultMeeting: Meeting = {
      id,
      sujet: '',
      dateHeure: '',
      projetId: 0,
      managerId: 0,
      rappel: false,
      statut: 'A_VENIR'
    };
    return of(meeting ?? defaultMeeting).pipe(delay(200));
  }

  
  getByManager(managerId: number): Observable<Meeting[]> {
    const managerMeetings = this.meetings.filter(m => m.managerId === managerId);
    return of(managerMeetings).pipe(delay(200));
  }

  
  getByParticipant(participantId: number): Observable<Meeting[]> {
    const participantMeetings = this.meetings.filter(
      m => m.participantIds?.includes(participantId)
    );
    return of(participantMeetings).pipe(delay(200));
  }

  
  getUpcoming(fromDate: string): Observable<Meeting[]> {
    const upcoming = this.meetings.filter(
      m => new Date(m.dateHeure) >= new Date(fromDate) && m.statut === 'A_VENIR'
    );
    return of(upcoming).pipe(delay(200));
  }

  
  update(id: number, dto: MeetingDto): Observable<Meeting> {
    let meeting = this.meetings.find(m => m.id === id);
    if (meeting) {
      Object.assign(meeting, dto);
      return of(meeting).pipe(delay(200));
    } else {
      
      return this.create(dto);
    }
  }

  
  updateReminder(id: number, rappel: boolean): Observable<Meeting> {
    let meeting = this.meetings.find(m => m.id === id);
    if (meeting) {
      meeting.rappel = rappel;
    }
    return of(meeting!).pipe(delay(200));
  }

  
  delete(id: number): Observable<void> {
    this.meetings = this.meetings.filter(m => m.id !== id);
    return of(void 0).pipe(delay(200));
  }

  
  assignProject(meetingId: number, projectId: number): Observable<Meeting> {
    let meeting = this.meetings.find(m => m.id === meetingId);
    if (meeting) {
      meeting.projetId = projectId;
    }
    return of(meeting!).pipe(delay(200));
  }

  
  addParticipant(meetingId: number, userId: number): Observable<Meeting> {
    let meeting = this.meetings.find(m => m.id === meetingId);
    if (meeting) {
      meeting.participantIds = meeting.participantIds || [];
      if (!meeting.participantIds.includes(userId)) {
        meeting.participantIds.push(userId);
      }
    }
    return of(meeting!).pipe(delay(200));
  }

  
  removeParticipant(meetingId: number, userId: number): Observable<Meeting> {
    let meeting = this.meetings.find(m => m.id === meetingId);
    if (meeting && meeting.participantIds) {
      meeting.participantIds = meeting.participantIds.filter(id => id !== userId);
    }
    return of(meeting!).pipe(delay(200));
  }

  
  search(
    sujet?: string,
    projectId?: number,
    startDate?: string,
    endDate?: string
  ): Observable<Meeting[]> {
    let results = [...this.meetings];
    if (sujet) {
      results = results.filter(m => m.sujet.includes(sujet));
    }
    if (projectId) {
      results = results.filter(m => m.projetId === projectId);
    }
    if (startDate) {
      results = results.filter(m => new Date(m.dateHeure) >= new Date(startDate));
    }
    if (endDate) {
      results = results.filter(m => new Date(m.dateHeure) <= new Date(endDate));
    }
    return of(results).pipe(delay(200));
  }

  
  searchBySujet(sujet: string): Observable<Meeting[]> {
    return of(this.meetings.filter(m => m.sujet.includes(sujet))).pipe(delay(200));
  }

  
  searchByProject(projectId: number): Observable<Meeting[]> {
    return of(this.meetings.filter(m => m.projetId === projectId)).pipe(delay(200));
  }

  
  searchByDateRange(startDate: string, endDate: string): Observable<Meeting[]> {
    let results = this.meetings.filter(
      m =>
        new Date(m.dateHeure) >= new Date(startDate.replace(/-/g, '/')) &&
        new Date(m.dateHeure) <= new Date(endDate.replace(/-/g, '/'))
    );
    return of(results).pipe(delay(200));
  }

  
  getForDeveloper(developerId: number): Observable<Meeting[]> {
    
    return this.getByParticipant(developerId);
  }

  
  getByProjectForDeveloper(developerId: number, projectId: number): Observable<Meeting[]> {
    return of(this.meetings.filter(
      m => m.projetId === projectId && m.participantIds?.includes(developerId)
    )).pipe(delay(200));
  }

  
  getDetailsForDeveloper(developerId: number, meetingId: number): Observable<Meeting> {
    const meeting = this.meetings.find(m => m.id === meetingId && m.participantIds?.includes(developerId));
    return of(meeting!).pipe(delay(200));
  }

  
  isInvited(developerId: number, meetingId: number): Observable<{ invited: boolean }> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    const invited = meeting?.participantIds?.includes(developerId) ?? false;
    return of({ invited }).pipe(delay(200));
  }

  
  getForDeveloperByMonth(developerId: number, year: number, month: number): Observable<Meeting[]> {
    const results = this.meetings.filter(m => {
      const date = new Date(m.dateHeure);
      return (
        m.participantIds?.includes(developerId) &&
        date.getFullYear() === year &&
        date.getMonth() + 1 === month
      );
    });
    return of(results).pipe(delay(200));
  }
}
