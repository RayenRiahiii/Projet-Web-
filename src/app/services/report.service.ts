import { Injectable } from '@angular/core';
import { Observable, Subject, of, delay } from 'rxjs';
import { Report } from '../models/report.models';
import { User, UserRole } from '../models/user.model';
import { AuthService, CurrentUser } from './auth.service';


let MOCK_REPORTS: Report[] = [
  {
    id: 1,
    fileName: "rapport1.pdf",
    filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    uploadDate: new Date().toISOString(),
    format: "PDF",
    status: "Complété",
    project: { id: 101, nom: "Projet Démo" },
    sender: { id: 1, nom: "Alice", email: "alice@example.com", role: UserRole.MANAGER },
    recipient: { id: 2, nom: "Bob", email: "bob@example.com", role: UserRole.DEVELOPPEUR }
  }
];

const MOCK_MANAGERS: User[] = [
  { id: 1, nom: "Alice", email: "alice@example.com", role: UserRole.MANAGER }
];
const MOCK_ADMINS: User[] = [
  { id: 3, nom: "Admin", email: "admin@example.com", role: UserRole.ADMIN }
];

@Injectable({ providedIn: 'root' })
export class ReportService {
  
  private readonly _updates$ = new Subject<Report>();
  readonly updates$ = this._updates$.asObservable();

  constructor(private auth: AuthService) {}

  
  initWebSocket(): void {
    
    setTimeout(() => {
      if (MOCK_REPORTS.length > 0) {
        this._updates$.next(MOCK_REPORTS[0]);
      }
    }, 5000);
  }
  closeWebSocket(): void {
    
  }

  
  uploadReport(file: File, projectId: number, senderId: number): Observable<Report> {
    const objectUrl = URL.createObjectURL(file);
    const report: Report = {
      id: MOCK_REPORTS.length + 1,
      fileName: file.name,
      filePath: objectUrl,
      uploadDate: new Date().toISOString(),
      format: file.name.endsWith('.pdf') ? "PDF" : "Autre",
      status: "Complété",
      project: { id: projectId, nom: "Projet " + projectId },
      sender: { id: senderId, nom: "Sender " + senderId, email: "", role: UserRole.MANAGER },
      recipient: null
    };
    MOCK_REPORTS.push(report);
    return of(report).pipe(delay(300));
  }

  sendReport(reportId: number, recipientId: number): Observable<Report> {
    const report = MOCK_REPORTS.find(r => r.id === reportId);
    if (report) {
      report.recipient = { id: recipientId, nom: "Recipient " + recipientId, email: "", role: UserRole.DEVELOPPEUR };
    }
    return of(report!).pipe(delay(200));
  }

  sendReportAdminToManager(reportId: number, managerId: number): Observable<Report> {
    return this.sendReport(reportId, managerId);
  }
  sendReportManagerToAdmin(reportId: number, adminId: number): Observable<Report> {
    return this.sendReport(reportId, adminId);
  }

  
  getAllManagers(): Observable<User[]> { return of(MOCK_MANAGERS).pipe(delay(200)); }
  getAllAdmins(): Observable<User[]>   { return of(MOCK_ADMINS).pipe(delay(200)); }

  
  getSentReports(senderId: number): Observable<Report[]> {
    return of(MOCK_REPORTS.filter(r => r.sender?.id === senderId)).pipe(delay(200));
  }

  getReceivedReports(recipientId: number): Observable<Report[]> {
    return of(MOCK_REPORTS.filter(r => r.recipient?.id === recipientId)).pipe(delay(200));
  }

  
  deleteReport(reportId: number): Observable<void> {
    MOCK_REPORTS = MOCK_REPORTS.filter(r => r.id !== reportId);
    return of(void 0).pipe(delay(200));
  }

  
  searchByFileName(name: string): Observable<Report[]> {
    return of(MOCK_REPORTS.filter(r => r.fileName.includes(name))).pipe(delay(200));
  }
  searchByProjectName(project: string): Observable<Report[]> {
    return of(MOCK_REPORTS.filter(r => r.project?.nom.includes(project))).pipe(delay(200));
  }
  searchBySenderName(sender: string): Observable<Report[]> {
    return of(MOCK_REPORTS.filter(r => r.sender?.nom.includes(sender))).pipe(delay(200));
  }

  
  getFileUrl(report: Report): string {
    return report.filePath;
  }
}
